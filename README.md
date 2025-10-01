# 📧 Email-to-Ticket Parser

**Free web-based tool to automatically extract and structure support ticket information from emails.**

[![Visitors](https://komarev.com/ghpvc/?username=email-to-ticket-parser&color=blue&style=flat-square&label=Visitors)](https://github.com/Turtles-AI-Lab/email-to-ticket-parser)

## 🎯 Features

- **Smart Email Parsing**: Automatically extracts sender, subject, and body
- **AI Classification**: Categorizes issues into 8 common support categories
- **Priority Detection**: Identifies urgent issues based on keywords
- **Confidence Scoring**: Shows how confident the AI is about the classification
- **Export Options**: Copy as JSON or formatted text
- **Zero Dependencies**: Pure vanilla JavaScript - works offline
- **Mobile Responsive**: Works on all devices

## 🚀 Try It Live

Simply open `index.html` in your browser - no installation needed!

Or visit the live demo: [Coming Soon]

## 📋 How It Works

1. **Paste Email**: Copy any support email into the text area
2. **Parse**: Click "Parse Email" to extract information
3. **Review**: See categorized, structured ticket data
4. **Export**: Copy as JSON or text for your helpdesk system

## 🎨 Use Cases

- **Support Teams**: Quickly triage incoming emails
- **MSPs**: Categorize client requests before creating tickets
- **Helpdesk Systems**: Pre-fill ticket forms with extracted data
- **Training**: Demonstrate email parsing and AI classification

## 🏷️ Supported Categories

- Password Reset
- Email Issues
- Printer Problems
- Network/VPN Issues
- Software Installation
- Access Requests
- Hardware Problems
- Performance Issues

## 💡 Example

**Input Email:**
```
From: john@company.com
Subject: Can't login to my account

Hi Support,

I've been locked out of my account for 2 hours.
I need access urgently for a client meeting.

Thanks,
John
```

**Parsed Output:**
```json
{
  "ticketId": "TKT-L8X9K2M-A3B4",
  "from": "john@company.com",
  "subject": "Can't login to my account",
  "category": "Password Reset",
  "priority": "urgent",
  "confidence": 0.75
}
```

## 🛠️ Technology Stack

- **HTML5/CSS3**: Modern, responsive design
- **Vanilla JavaScript**: No frameworks, fast and lightweight
- **AI Pattern Matching**: Keyword-based classification
- **Client-Side Only**: Your data never leaves your browser

## 📦 Installation

### Option 1: Direct Use
```bash
# Clone the repository
git clone https://github.com/Turtles-AI-Lab/email-to-ticket-parser.git

# Open in browser
cd email-to-ticket-parser
open index.html
```

### Option 2: GitHub Pages
Fork this repo and enable GitHub Pages in settings!

## 🔧 Customization

### Add Custom Categories

Edit `js/parser.js` and add your category:

```javascript
your_category: {
    keywords: ['keyword1', 'keyword2', 'keyword3'],
    priority: 'medium'
}
```

### Modify Priority Rules

Edit the `determinePriority()` function in `js/parser.js`.

### Change Styling

All styles are in `css/style.css` - customize colors, fonts, and layouts.

## 🤝 Related Projects

- [AI Ticket Classifier](https://github.com/Turtles-AI-Lab/ai-ticket-classifier) - Python library for ticket classification
- [LLM Cost Calculator](https://github.com/Turtles-AI-Lab/llm-cost-calculator) - Compare AI API costs
- [TicketZero AI](https://github.com/Turtles-AI-Lab/TicketZero-Atera-Edition) - Automated ticket resolution

## 📝 License

MIT License - feel free to use in your projects!

## 🙋 Support

- **Issues**: [GitHub Issues](https://github.com/Turtles-AI-Lab/email-to-ticket-parser/issues)
- **Email**: jgreenia@jandraisolutions.com

## 🌟 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

---

**Built by [Turtles AI Lab](https://github.com/Turtles-AI-Lab)** | **Free & Open Source**
