import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';
import { createApiErrorHandler } from '@/lib/error-reporting';

const errorHandler = createApiErrorHandler('parse-document');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require('mammoth');

// File size limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_TEXT_LENGTH = 100;
const MAX_TEXT_LENGTH = 500000; // 500k characters

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(`parse:${clientIP}`, RATE_LIMITS.parseDocument);

    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before trying again.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    let formData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }

    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: 'File too large. Maximum size is 10MB.'
      }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({
        error: 'File is empty. Please upload a valid document.'
      }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    let buffer: Buffer;

    try {
      buffer = Buffer.from(await file.arrayBuffer());
    } catch {
      return NextResponse.json({
        error: 'Failed to read file. Please try again.'
      }, { status: 400 });
    }

    let text = '';

    if (fileName.endsWith('.pdf')) {
      try {
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        return NextResponse.json({
          error: 'Could not read this PDF. It may be corrupted, password-protected, or a scanned image. Try saving it as a different PDF or DOCX.'
        }, { status: 400 });
      }
    } else if (fileName.endsWith('.docx')) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } catch (docxError) {
        console.error('DOCX parsing error:', docxError);
        return NextResponse.json({
          error: 'Could not read this DOCX file. It may be corrupted. Try opening and re-saving it in Word.'
        }, { status: 400 });
      }
    } else if (fileName.endsWith('.doc')) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } catch {
        return NextResponse.json({
          error: 'Old .doc format not supported. Please save as .docx or PDF in Word.'
        }, { status: 400 });
      }
    } else if (fileName.endsWith('.txt')) {
      try {
        text = buffer.toString('utf-8');
      } catch {
        return NextResponse.json({
          error: 'Could not read this text file. Please ensure it\'s UTF-8 encoded.'
        }, { status: 400 });
      }
    } else {
      return NextResponse.json({
        error: 'Unsupported file type. Please upload a PDF, DOCX, or TXT file.'
      }, { status: 400 });
    }

    // Clean up the text
    text = text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\t/g, ' ')
      .replace(/ {2,}/g, ' ')
      .trim();

    // Validate extracted text
    if (text.length < MIN_TEXT_LENGTH) {
      return NextResponse.json({
        error: 'Could not extract enough text from this document. If it\'s a scanned PDF, try using OCR software first or manually type/paste the contract text.'
      }, { status: 400 });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      console.warn(`Document truncated from ${text.length} to ${MAX_TEXT_LENGTH} characters`);
      text = text.substring(0, MAX_TEXT_LENGTH);
    }

    const duration = Date.now() - startTime;
    console.log(`Document parsed in ${duration}ms: ${file.name} (${text.length} chars)`);

    return NextResponse.json({
      success: true,
      text,
      fileName: file.name,
      fileSize: file.size,
      characterCount: text.length,
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
      processingTime: duration
    });

  } catch (error) {
    console.error('Document parsing error:', error);
    errorHandler.capture(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({
      error: 'Failed to process document. Please try a different file format.'
    }, { status: 500 });
  }
}

