import { NextRequest, NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require('mammoth');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    let text = '';

    if (fileName.endsWith('.pdf')) {
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;
    } else if (fileName.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (fileName.endsWith('.doc')) {
      // .doc files are harder - try mammoth anyway
      try {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } catch {
        return NextResponse.json({
          error: 'Old .doc format not supported. Please save as .docx or PDF'
        }, { status: 400 });
      }
    } else if (fileName.endsWith('.txt')) {
      text = buffer.toString('utf-8');
    } else {
      return NextResponse.json({
        error: 'Unsupported file type. Please upload PDF, DOCX, or TXT'
      }, { status: 400 });
    }

    // Clean up the text
    text = text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (text.length < 100) {
      return NextResponse.json({
        error: 'Could not extract enough text from this document. Try a different file.'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      text,
      fileName: file.name,
      fileSize: file.size,
      characterCount: text.length,
      wordCount: text.split(/\s+/).length
    });

  } catch (error) {
    console.error('Document parsing error:', error);
    return NextResponse.json({ error: 'Failed to parse document' }, { status: 500 });
  }
}

