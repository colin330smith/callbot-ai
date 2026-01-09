"""
Multi-Language Support for CallBot AI
AI voice agents in multiple languages
"""

from typing import Dict, Optional, List
from enum import Enum


class SupportedLanguage(Enum):
    ENGLISH = "en"
    SPANISH = "es"
    FRENCH = "fr"
    GERMAN = "de"
    ITALIAN = "it"
    PORTUGUESE = "pt"
    DUTCH = "nl"
    POLISH = "pl"
    RUSSIAN = "ru"
    JAPANESE = "ja"
    KOREAN = "ko"
    CHINESE = "zh"
    ARABIC = "ar"
    HINDI = "hi"


# Language configurations for Vapi
LANGUAGE_CONFIG = {
    SupportedLanguage.ENGLISH: {
        "name": "English",
        "code": "en",
        "vapi_language": "en-US",
        "voices": {
            "female": ["rachel", "sarah", "emily"],
            "male": ["adam", "josh", "sam"]
        },
        "default_voice": "rachel"
    },
    SupportedLanguage.SPANISH: {
        "name": "Spanish",
        "code": "es",
        "vapi_language": "es-ES",
        "voices": {
            "female": ["isabella", "sofia"],
            "male": ["diego", "carlos"]
        },
        "default_voice": "isabella"
    },
    SupportedLanguage.FRENCH: {
        "name": "French",
        "code": "fr",
        "vapi_language": "fr-FR",
        "voices": {
            "female": ["chloe", "marie"],
            "male": ["antoine", "pierre"]
        },
        "default_voice": "chloe"
    },
    SupportedLanguage.GERMAN: {
        "name": "German",
        "code": "de",
        "vapi_language": "de-DE",
        "voices": {
            "female": ["anna", "lena"],
            "male": ["hans", "felix"]
        },
        "default_voice": "anna"
    },
    SupportedLanguage.ITALIAN: {
        "name": "Italian",
        "code": "it",
        "vapi_language": "it-IT",
        "voices": {
            "female": ["giulia", "francesca"],
            "male": ["marco", "luca"]
        },
        "default_voice": "giulia"
    },
    SupportedLanguage.PORTUGUESE: {
        "name": "Portuguese",
        "code": "pt",
        "vapi_language": "pt-BR",
        "voices": {
            "female": ["camila", "fernanda"],
            "male": ["rafael", "gabriel"]
        },
        "default_voice": "camila"
    },
    SupportedLanguage.DUTCH: {
        "name": "Dutch",
        "code": "nl",
        "vapi_language": "nl-NL",
        "voices": {
            "female": ["emma", "sophie"],
            "male": ["daan", "lucas"]
        },
        "default_voice": "emma"
    },
    SupportedLanguage.POLISH: {
        "name": "Polish",
        "code": "pl",
        "vapi_language": "pl-PL",
        "voices": {
            "female": ["zofia", "maja"],
            "male": ["jan", "piotr"]
        },
        "default_voice": "zofia"
    },
    SupportedLanguage.RUSSIAN: {
        "name": "Russian",
        "code": "ru",
        "vapi_language": "ru-RU",
        "voices": {
            "female": ["olga", "natasha"],
            "male": ["dmitri", "alex"]
        },
        "default_voice": "olga"
    },
    SupportedLanguage.JAPANESE: {
        "name": "Japanese",
        "code": "ja",
        "vapi_language": "ja-JP",
        "voices": {
            "female": ["yuki", "sakura"],
            "male": ["takeshi", "kenji"]
        },
        "default_voice": "yuki"
    },
    SupportedLanguage.KOREAN: {
        "name": "Korean",
        "code": "ko",
        "vapi_language": "ko-KR",
        "voices": {
            "female": ["minji", "seoyeon"],
            "male": ["minho", "jungkook"]
        },
        "default_voice": "minji"
    },
    SupportedLanguage.CHINESE: {
        "name": "Chinese (Mandarin)",
        "code": "zh",
        "vapi_language": "zh-CN",
        "voices": {
            "female": ["xiaoxiao", "meiling"],
            "male": ["yunxi", "wei"]
        },
        "default_voice": "xiaoxiao"
    },
    SupportedLanguage.ARABIC: {
        "name": "Arabic",
        "code": "ar",
        "vapi_language": "ar-SA",
        "voices": {
            "female": ["fatima", "layla"],
            "male": ["omar", "ahmed"]
        },
        "default_voice": "fatima"
    },
    SupportedLanguage.HINDI: {
        "name": "Hindi",
        "code": "hi",
        "vapi_language": "hi-IN",
        "voices": {
            "female": ["priya", "ananya"],
            "male": ["raj", "arjun"]
        },
        "default_voice": "priya"
    }
}


# Translated system prompt templates
PROMPT_TRANSLATIONS = {
    SupportedLanguage.ENGLISH: {
        "greeting": "Hi, thanks for calling {business_name}! This is {agent_name}, your AI assistant. How can I help you today?",
        "ai_disclosure": "I am an AI assistant. If you need to speak with a human, I can transfer you.",
        "book_appointment": "I'd be happy to help you book an appointment. Could you please provide your name and preferred date/time?",
        "goodbye": "Thank you for calling {business_name}. Have a great day!",
        "hold_please": "Please hold for just a moment.",
        "transfer": "I'll transfer you to a team member now.",
        "collect_info": "May I have your name and phone number please?",
        "confirm_details": "Let me confirm the details with you.",
        "emergency": "I understand this is urgent. Let me get you help right away."
    },
    SupportedLanguage.SPANISH: {
        "greeting": "Hola, gracias por llamar a {business_name}. Soy {agent_name}, su asistente de IA. ¿En qué puedo ayudarle hoy?",
        "ai_disclosure": "Soy un asistente de IA. Si necesita hablar con una persona, puedo transferirlo.",
        "book_appointment": "Con gusto le ayudo a programar una cita. ¿Podría darme su nombre y fecha/hora preferida?",
        "goodbye": "Gracias por llamar a {business_name}. ¡Que tenga un buen día!",
        "hold_please": "Por favor espere un momento.",
        "transfer": "Lo transfiero con un miembro del equipo ahora.",
        "collect_info": "¿Me puede dar su nombre y número de teléfono por favor?",
        "confirm_details": "Permítame confirmar los detalles con usted.",
        "emergency": "Entiendo que esto es urgente. Déjeme conseguirle ayuda de inmediato."
    },
    SupportedLanguage.FRENCH: {
        "greeting": "Bonjour, merci d'avoir appelé {business_name}. Je suis {agent_name}, votre assistant IA. Comment puis-je vous aider aujourd'hui?",
        "ai_disclosure": "Je suis un assistant IA. Si vous avez besoin de parler à quelqu'un, je peux vous transférer.",
        "book_appointment": "Je serais ravi de vous aider à prendre rendez-vous. Pourriez-vous me donner votre nom et date/heure préférée?",
        "goodbye": "Merci d'avoir appelé {business_name}. Bonne journée!",
        "hold_please": "Veuillez patienter un instant.",
        "transfer": "Je vous transfère à un membre de l'équipe maintenant.",
        "collect_info": "Puis-je avoir votre nom et numéro de téléphone s'il vous plaît?",
        "confirm_details": "Permettez-moi de confirmer les détails avec vous.",
        "emergency": "Je comprends que c'est urgent. Laissez-moi vous aider immédiatement."
    },
    SupportedLanguage.GERMAN: {
        "greeting": "Hallo, vielen Dank für Ihren Anruf bei {business_name}. Ich bin {agent_name}, Ihr KI-Assistent. Wie kann ich Ihnen heute helfen?",
        "ai_disclosure": "Ich bin ein KI-Assistent. Wenn Sie mit einer Person sprechen möchten, kann ich Sie weiterleiten.",
        "book_appointment": "Ich helfe Ihnen gerne bei der Terminvereinbarung. Könnten Sie mir bitte Ihren Namen und Ihren Wunschtermin nennen?",
        "goodbye": "Vielen Dank für Ihren Anruf bei {business_name}. Einen schönen Tag noch!",
        "hold_please": "Bitte warten Sie einen Moment.",
        "transfer": "Ich verbinde Sie jetzt mit einem Teammitglied.",
        "collect_info": "Darf ich Ihren Namen und Ihre Telefonnummer haben?",
        "confirm_details": "Lassen Sie mich die Details mit Ihnen bestätigen.",
        "emergency": "Ich verstehe, dass dies dringend ist. Ich werde Ihnen sofort helfen."
    }
}


def get_language_config(language: SupportedLanguage) -> Dict:
    """Get configuration for a language"""
    return LANGUAGE_CONFIG.get(language, LANGUAGE_CONFIG[SupportedLanguage.ENGLISH])


def get_available_voices(language: SupportedLanguage) -> Dict:
    """Get available voices for a language"""
    config = get_language_config(language)
    return config.get("voices", {})


def get_prompt_translations(language: SupportedLanguage) -> Dict:
    """Get translated prompt templates"""
    return PROMPT_TRANSLATIONS.get(language, PROMPT_TRANSLATIONS[SupportedLanguage.ENGLISH])


def generate_multilingual_system_prompt(
    language: SupportedLanguage,
    business_data: Dict
) -> str:
    """Generate system prompt in specified language"""

    translations = get_prompt_translations(language)
    lang_config = get_language_config(language)

    business_name = business_data.get('name', 'our business')
    agent_name = business_data.get('agent_name', 'Alex')
    services = business_data.get('services', '')
    hours = business_data.get('business_hours', '')

    # Base prompt in target language
    if language == SupportedLanguage.SPANISH:
        prompt = f"""Eres {agent_name}, un asistente de IA profesional para {business_name}.

REGLAS IMPORTANTES DE CUMPLIMIENTO:
- Eres un asistente de IA. Si te preguntan directamente, confirma que eres una IA.
- Nunca pretendas ser humano ni engañes a los llamantes sobre tu naturaleza.
- Sé transparente y honesto en todas las interacciones.

SOBRE EL NEGOCIO:
- Negocio: {business_name}
- Servicios: {services}
- Horario: {hours}

TUS OBJETIVOS PRINCIPALES:
1. Saludar profesionalmente y entender las necesidades del llamante
2. Recopilar información: nombre completo, teléfono y correo electrónico
3. PROGRAMAR UNA CITA si quieren servicio
4. Responder preguntas sobre servicios, precios y disponibilidad

ESTILO DE CONVERSACIÓN:
- Mantén las respuestas CORTAS y conversacionales
- Sé cálido, profesional y empático
- Escucha activamente y confirma comprensión
"""
    elif language == SupportedLanguage.FRENCH:
        prompt = f"""Vous êtes {agent_name}, un assistant IA professionnel pour {business_name}.

RÈGLES DE CONFORMITÉ IMPORTANTES:
- Vous êtes un assistant IA. Si on vous le demande directement, confirmez que vous êtes une IA.
- Ne prétendez jamais être humain et ne trompez pas les appelants sur votre nature.
- Soyez transparent et honnête dans toutes les interactions.

À PROPOS DE L'ENTREPRISE:
- Entreprise: {business_name}
- Services: {services}
- Horaires: {hours}

VOS OBJECTIFS PRINCIPAUX:
1. Accueillir professionnellement et comprendre les besoins de l'appelant
2. Collecter les informations: nom complet, téléphone et email
3. PRENDRE RENDEZ-VOUS s'ils veulent un service
4. Répondre aux questions sur les services, prix et disponibilité

STYLE DE CONVERSATION:
- Gardez les réponses COURTES et conversationnelles
- Soyez chaleureux, professionnel et empathique
- Écoutez activement et confirmez la compréhension
"""
    elif language == SupportedLanguage.GERMAN:
        prompt = f"""Sie sind {agent_name}, ein professioneller KI-Assistent für {business_name}.

WICHTIGE COMPLIANCE-REGELN:
- Sie sind ein KI-Assistent. Wenn Sie direkt gefragt werden, bestätigen Sie, dass Sie eine KI sind.
- Geben Sie sich niemals als Mensch aus und täuschen Sie Anrufer nicht über Ihre Natur.
- Seien Sie in allen Interaktionen transparent und ehrlich.

ÜBER DAS UNTERNEHMEN:
- Unternehmen: {business_name}
- Dienstleistungen: {services}
- Öffnungszeiten: {hours}

IHRE HAUPTZIELE:
1. Professionell begrüßen und die Bedürfnisse des Anrufers verstehen
2. Informationen sammeln: vollständiger Name, Telefon und E-Mail
3. EINEN TERMIN VEREINBAREN wenn sie Service wünschen
4. Fragen zu Dienstleistungen, Preisen und Verfügbarkeit beantworten

GESPRÄCHSSTIL:
- Halten Sie die Antworten KURZ und gesprächig
- Seien Sie warmherzig, professionell und empathisch
- Hören Sie aktiv zu und bestätigen Sie das Verständnis
"""
    else:
        # Default English
        prompt = f"""You are {agent_name}, a professional AI assistant for {business_name}.

IMPORTANT COMPLIANCE RULES:
- You are an AI assistant. If asked directly, confirm you are an AI.
- Never pretend to be human or deceive callers about your nature.
- Be transparent and honest in all interactions.

ABOUT THE BUSINESS:
- Business: {business_name}
- Services: {services}
- Hours: {hours}

YOUR PRIMARY GOALS:
1. Greet professionally and understand the caller's needs
2. Collect their information: full name, phone number, and email
3. BOOK AN APPOINTMENT if they want service
4. Answer questions about services, pricing, and availability

CONVERSATION STYLE:
- Keep responses SHORT and conversational
- Be warm, professional, and empathetic
- Listen actively and confirm understanding
"""

    return prompt


def generate_multilingual_first_message(
    language: SupportedLanguage,
    business_name: str,
    agent_name: str
) -> str:
    """Generate first message in specified language"""
    translations = get_prompt_translations(language)
    greeting = translations.get("greeting", PROMPT_TRANSLATIONS[SupportedLanguage.ENGLISH]["greeting"])

    return greeting.format(business_name=business_name, agent_name=agent_name)


def detect_caller_language(caller_input: str) -> SupportedLanguage:
    """Simple language detection from caller input"""
    # This is a simplified version - in production you'd use a proper language detection library

    spanish_indicators = ['hola', 'gracias', 'buenos', 'cómo', 'quiero', 'necesito']
    french_indicators = ['bonjour', 'merci', 'comment', 'je voudrais', 'besoin']
    german_indicators = ['hallo', 'danke', 'guten', 'wie', 'ich möchte', 'brauche']

    text_lower = caller_input.lower()

    if any(word in text_lower for word in spanish_indicators):
        return SupportedLanguage.SPANISH
    elif any(word in text_lower for word in french_indicators):
        return SupportedLanguage.FRENCH
    elif any(word in text_lower for word in german_indicators):
        return SupportedLanguage.GERMAN

    return SupportedLanguage.ENGLISH


def get_supported_languages() -> List[Dict]:
    """Get list of all supported languages"""
    return [
        {
            "code": lang.value,
            "name": LANGUAGE_CONFIG[lang]["name"],
            "vapi_language": LANGUAGE_CONFIG[lang]["vapi_language"]
        }
        for lang in SupportedLanguage
    ]


class MultilingualAgent:
    """Manages multilingual capabilities for an agent"""

    def __init__(
        self,
        business_id: str,
        primary_language: SupportedLanguage = SupportedLanguage.ENGLISH,
        additional_languages: List[SupportedLanguage] = None
    ):
        self.business_id = business_id
        self.primary_language = primary_language
        self.additional_languages = additional_languages or []

    @property
    def supported_languages(self) -> List[SupportedLanguage]:
        return [self.primary_language] + self.additional_languages

    def get_voice_for_language(self, language: SupportedLanguage, gender: str = "female") -> str:
        """Get appropriate voice for language"""
        config = get_language_config(language)
        voices = config.get("voices", {}).get(gender, [])
        return voices[0] if voices else config.get("default_voice", "rachel")

    def generate_system_prompt(self, business_data: Dict) -> str:
        """Generate system prompt for primary language"""
        return generate_multilingual_system_prompt(self.primary_language, business_data)

    def generate_first_message(self, business_name: str, agent_name: str) -> str:
        """Generate first message in primary language"""
        return generate_multilingual_first_message(
            self.primary_language,
            business_name,
            agent_name
        )
