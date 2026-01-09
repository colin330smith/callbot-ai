"""
Embeddable Web Widget for CallBot AI
Allows businesses to add click-to-call/chat to their websites
"""

import os
import secrets
import hashlib
from datetime import datetime
from typing import Dict, Optional, List
from enum import Enum


class WidgetType(Enum):
    CLICK_TO_CALL = "click_to_call"
    CHAT = "chat"
    CALLBACK_REQUEST = "callback_request"
    FULL = "full"  # All features


class WidgetPosition(Enum):
    BOTTOM_RIGHT = "bottom-right"
    BOTTOM_LEFT = "bottom-left"
    TOP_RIGHT = "top-right"
    TOP_LEFT = "top-left"


class WidgetConfig:
    """Configuration for an embeddable widget"""

    def __init__(
        self,
        widget_id: str,
        business_id: str,
        widget_type: WidgetType = WidgetType.FULL
    ):
        self.id = widget_id
        self.business_id = business_id
        self.type = widget_type
        self.created_at = datetime.utcnow()
        self.active = True

        # Appearance
        self.appearance = {
            "position": WidgetPosition.BOTTOM_RIGHT.value,
            "primary_color": "#4F46E5",
            "text_color": "#FFFFFF",
            "button_icon": "phone",  # phone, chat, headset
            "button_size": "medium",  # small, medium, large
            "button_text": "Talk to Us",
            "show_on_mobile": True,
            "hide_on_scroll": False,
            "animation": "bounce"  # bounce, pulse, none
        }

        # Behavior
        self.behavior = {
            "greeting_message": "Hi! How can we help you today?",
            "offline_message": "We're currently offline. Leave your number and we'll call you back!",
            "auto_open_delay": 0,  # seconds, 0 = disabled
            "show_agent_photo": True,
            "collect_info_before_call": True,
            "required_fields": ["name", "phone"],
            "optional_fields": ["email", "message"]
        }

        # Domain restrictions
        self.allowed_domains = []  # Empty = all domains allowed

        # Analytics
        self.total_views = 0
        self.total_interactions = 0
        self.total_calls_initiated = 0


def generate_widget_id(business_id: str) -> str:
    """Generate unique widget ID"""
    return f"w_{hashlib.sha256(f'{business_id}{secrets.token_hex(8)}'.encode()).hexdigest()[:16]}"


def generate_embed_code(widget_config: WidgetConfig, base_url: str) -> str:
    """Generate embeddable JavaScript code"""

    widget_id = widget_config.id

    return f'''<!-- CallBot AI Widget -->
<script>
(function() {{
  var script = document.createElement('script');
  script.src = '{base_url}/widget/{widget_id}/loader.js';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}})();
</script>
<!-- End CallBot AI Widget -->'''


def generate_widget_loader_js(widget_config: WidgetConfig, base_url: str, vapi_phone: str) -> str:
    """Generate the widget loader JavaScript"""

    config = widget_config
    appearance = config.appearance
    behavior = config.behavior

    return f'''
(function() {{
  'use strict';

  // Widget Configuration
  var WIDGET_ID = '{config.id}';
  var BASE_URL = '{base_url}';
  var VAPI_PHONE = '{vapi_phone}';
  var CONFIG = {{
    position: '{appearance["position"]}',
    primaryColor: '{appearance["primary_color"]}',
    textColor: '{appearance["text_color"]}',
    buttonIcon: '{appearance["button_icon"]}',
    buttonSize: '{appearance["button_size"]}',
    buttonText: '{appearance["button_text"]}',
    showOnMobile: {str(appearance["show_on_mobile"]).lower()},
    greetingMessage: '{behavior["greeting_message"]}',
    offlineMessage: '{behavior["offline_message"]}',
    collectInfoBeforeCall: {str(behavior["collect_info_before_call"]).lower()},
    requiredFields: {behavior["required_fields"]},
    optionalFields: {behavior["optional_fields"]}
  }};

  // Styles
  var styles = `
    .callbot-widget-container {{
      position: fixed;
      {appearance["position"].replace("-", ": 20px; ").replace("bottom", "bottom: 20px").replace("top", "top: 20px")};
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    }}

    .callbot-widget-button {{
      width: ${{CONFIG.buttonSize === 'small' ? '48px' : CONFIG.buttonSize === 'large' ? '72px' : '60px'}};
      height: ${{CONFIG.buttonSize === 'small' ? '48px' : CONFIG.buttonSize === 'large' ? '72px' : '60px'}};
      border-radius: 50%;
      background: ${{CONFIG.primaryColor}};
      color: ${{CONFIG.textColor}};
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }}

    .callbot-widget-button:hover {{
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0,0,0,0.2);
    }}

    .callbot-widget-button svg {{
      width: 24px;
      height: 24px;
    }}

    .callbot-widget-popup {{
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 320px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
      overflow: hidden;
      display: none;
      animation: callbot-slide-up 0.3s ease;
    }}

    @keyframes callbot-slide-up {{
      from {{ opacity: 0; transform: translateY(20px); }}
      to {{ opacity: 1; transform: translateY(0); }}
    }}

    .callbot-widget-popup.open {{
      display: block;
    }}

    .callbot-widget-header {{
      background: ${{CONFIG.primaryColor}};
      color: ${{CONFIG.textColor}};
      padding: 16px;
      text-align: center;
    }}

    .callbot-widget-header h3 {{
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 600;
    }}

    .callbot-widget-header p {{
      margin: 0;
      font-size: 13px;
      opacity: 0.9;
    }}

    .callbot-widget-body {{
      padding: 20px;
    }}

    .callbot-widget-form input {{
      width: 100%;
      padding: 12px;
      margin-bottom: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      box-sizing: border-box;
    }}

    .callbot-widget-form input:focus {{
      outline: none;
      border-color: ${{CONFIG.primaryColor}};
    }}

    .callbot-widget-call-btn {{
      width: 100%;
      padding: 14px;
      background: ${{CONFIG.primaryColor}};
      color: ${{CONFIG.textColor}};
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }}

    .callbot-widget-call-btn:hover {{
      opacity: 0.9;
    }}

    .callbot-widget-footer {{
      padding: 12px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
    }}

    @media (max-width: 480px) {{
      .callbot-widget-popup {{
        width: calc(100vw - 40px);
        right: 0;
        left: 0;
        margin: 0 auto;
      }}
    }}
  `;

  // Icons
  var icons = {{
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
  }};

  // Create widget HTML
  function createWidget() {{
    // Add styles
    var styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    // Create container
    var container = document.createElement('div');
    container.className = 'callbot-widget-container';
    container.id = 'callbot-widget';

    container.innerHTML = `
      <div class="callbot-widget-popup" id="callbot-popup">
        <div class="callbot-widget-header">
          <h3>${{CONFIG.greetingMessage}}</h3>
          <p>We'll call you right away!</p>
        </div>
        <div class="callbot-widget-body">
          <form class="callbot-widget-form" id="callbot-form">
            <input type="text" name="name" placeholder="Your Name *" required>
            <input type="tel" name="phone" placeholder="Phone Number *" required>
            <input type="email" name="email" placeholder="Email (optional)">
            <button type="submit" class="callbot-widget-call-btn">
              ${{icons.phone}}
              <span>Call Me Now</span>
            </button>
          </form>
        </div>
        <div class="callbot-widget-footer">
          Powered by CallBot AI
        </div>
      </div>
      <button class="callbot-widget-button" id="callbot-btn" aria-label="${{CONFIG.buttonText}}">
        ${{icons[CONFIG.buttonIcon]}}
      </button>
    `;

    document.body.appendChild(container);

    // Event listeners
    var btn = document.getElementById('callbot-btn');
    var popup = document.getElementById('callbot-popup');
    var form = document.getElementById('callbot-form');

    btn.addEventListener('click', function() {{
      popup.classList.toggle('open');
      if (popup.classList.contains('open')) {{
        trackEvent('widget_opened');
        btn.innerHTML = icons.close;
      }} else {{
        btn.innerHTML = icons[CONFIG.buttonIcon];
      }}
    }});

    form.addEventListener('submit', function(e) {{
      e.preventDefault();
      var formData = new FormData(form);
      var data = {{}};
      formData.forEach(function(value, key) {{ data[key] = value; }});

      // Send to backend
      fetch(BASE_URL + '/api/widget/' + WIDGET_ID + '/request-call', {{
        method: 'POST',
        headers: {{ 'Content-Type': 'application/json' }},
        body: JSON.stringify(data)
      }})
      .then(function(res) {{ return res.json(); }})
      .then(function(result) {{
        if (result.success) {{
          form.innerHTML = '<p style="text-align:center;color:#10b981;">✓ We\\'ll call you shortly!</p>';
          trackEvent('call_requested');
        }} else {{
          alert('Error: ' + (result.error || 'Please try again'));
        }}
      }})
      .catch(function(err) {{
        console.error('CallBot Widget Error:', err);
        alert('Connection error. Please try again.');
      }});
    }});

    // Track page view
    trackEvent('widget_loaded');
  }}

  function trackEvent(event) {{
    fetch(BASE_URL + '/api/widget/' + WIDGET_ID + '/event', {{
      method: 'POST',
      headers: {{ 'Content-Type': 'application/json' }},
      body: JSON.stringify({{ event: event, timestamp: new Date().toISOString() }})
    }}).catch(function() {{}});
  }}

  // Initialize
  if (document.readyState === 'loading') {{
    document.addEventListener('DOMContentLoaded', createWidget);
  }} else {{
    createWidget();
  }}
}})();
'''


class WidgetManager:
    """Manages widgets for businesses"""

    def __init__(self):
        self.widgets: Dict[str, WidgetConfig] = {}

    def create_widget(
        self,
        business_id: str,
        widget_type: WidgetType = WidgetType.FULL
    ) -> WidgetConfig:
        """Create a new widget for a business"""
        widget_id = generate_widget_id(business_id)
        widget = WidgetConfig(widget_id, business_id, widget_type)
        self.widgets[widget_id] = widget
        return widget

    def get_widget(self, widget_id: str) -> Optional[WidgetConfig]:
        """Get widget by ID"""
        return self.widgets.get(widget_id)

    def get_business_widgets(self, business_id: str) -> List[WidgetConfig]:
        """Get all widgets for a business"""
        return [w for w in self.widgets.values() if w.business_id == business_id]

    def update_widget(self, widget_id: str, updates: Dict) -> bool:
        """Update widget configuration"""
        widget = self.get_widget(widget_id)
        if not widget:
            return False

        if "appearance" in updates:
            widget.appearance.update(updates["appearance"])
        if "behavior" in updates:
            widget.behavior.update(updates["behavior"])
        if "allowed_domains" in updates:
            widget.allowed_domains = updates["allowed_domains"]
        if "active" in updates:
            widget.active = updates["active"]

        return True

    def delete_widget(self, widget_id: str) -> bool:
        """Delete a widget"""
        if widget_id in self.widgets:
            del self.widgets[widget_id]
            return True
        return False

    def record_event(self, widget_id: str, event: str):
        """Record widget analytics event"""
        widget = self.get_widget(widget_id)
        if widget:
            if event == "widget_loaded":
                widget.total_views += 1
            elif event == "widget_opened":
                widget.total_interactions += 1
            elif event == "call_requested":
                widget.total_calls_initiated += 1


# Global widget manager
widget_manager = WidgetManager()
