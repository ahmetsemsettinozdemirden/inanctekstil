#!/usr/bin/env python3
"""Generate Google Ads API Tool Design Document as PDF."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register Arial Unicode for Turkish character support
pdfmetrics.registerFont(TTFont("ArialUnicode", "/Library/Fonts/Arial Unicode.ttf"))

OUTPUT = "/Users/semsettin/workspace/inanc-tekstil/technical/google-ads/tool-design-document.pdf"

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    rightMargin=2.5*cm,
    leftMargin=2.5*cm,
    topMargin=2.5*cm,
    bottomMargin=2.5*cm,
)

styles = getSampleStyleSheet()
title_style = ParagraphStyle("Title", parent=styles["Heading1"], fontName="ArialUnicode", alignment=TA_CENTER, fontSize=16, spaceAfter=12)
h2_style = ParagraphStyle("H2", parent=styles["Heading2"], fontName="ArialUnicode", fontSize=13, spaceAfter=6, spaceBefore=14)
body_style = ParagraphStyle("Body", parent=styles["Normal"], fontName="ArialUnicode", fontSize=11, spaceAfter=6, leading=16)
bullet_style = ParagraphStyle("Bullet", parent=styles["Normal"], fontName="ArialUnicode", fontSize=11, spaceAfter=4, leftIndent=20, leading=16)

content = []

content.append(Paragraph("Google Ads API Tool Design Document", title_style))
content.append(Paragraph("İnanç Tekstil — Internal Campaign Management Tool", ParagraphStyle("sub", parent=styles["Normal"], fontName="ArialUnicode", alignment=TA_CENTER, fontSize=12, textColor="#555555", spaceAfter=20)))
content.append(Spacer(1, 0.3*cm))

content.append(Paragraph("1. Company Overview", h2_style))
content.append(Paragraph(
    "İnanç Tekstil is a custom curtain manufacturer and retailer based in İskenderun, Hatay, Turkey. "
    "The company sells curtains (tül, fon, blackout, saten) through its Shopify e-commerce store at inanctekstil.store. "
    "The business is owner-operated with a small team.", body_style))

content.append(Paragraph("2. Purpose of the Tool", h2_style))
content.append(Paragraph(
    "The purpose of this tool is to allow the business owner to manage their own Google Ads campaigns "
    "programmatically using the Google Ads API integrated with Claude Code (an AI-powered development assistant). "
    "The tool is strictly for internal use — no external clients or third parties will have access.", body_style))
content.append(Paragraph(
    "The primary use cases are:", body_style))
content.append(Paragraph("• Viewing campaign performance metrics (impressions, clicks, conversions, cost)", bullet_style))
content.append(Paragraph("• Updating campaign budgets and bid strategies", bullet_style))
content.append(Paragraph("• Pausing or enabling campaigns, ad groups, and ads", bullet_style))
content.append(Paragraph("• Creating and managing keywords", bullet_style))
content.append(Paragraph("• Generating performance reports", bullet_style))

content.append(Paragraph("3. Tool Architecture", h2_style))
content.append(Paragraph(
    "The tool consists of the following components:", body_style))
content.append(Paragraph(
    "• Google Ads MCP Server: An open-source Model Context Protocol server "
    "(github.com/google-marketing-solutions/google_ads_mcp) that wraps the Google Ads API. "
    "It runs locally on the business owner's machine (macOS) as an HTTP service on localhost:8000.", bullet_style))
content.append(Paragraph(
    "• Claude Code: An AI assistant (claude.ai/claude-code) used as the interface layer. "
    "The business owner types natural language commands (e.g. 'show campaign performance this week') "
    "and Claude Code translates these into API calls via the MCP server.", bullet_style))
content.append(Paragraph(
    "• google-ads.yaml: A local credentials file on the owner's machine storing OAuth2 credentials "
    "and the developer token. This file is never shared or uploaded anywhere.", bullet_style))

content.append(Paragraph("4. Data Access Scope", h2_style))
content.append(Paragraph(
    "The tool accesses only the advertiser's own Google Ads account (MCC: 129-569-2511). "
    "No data from any other advertiser or customer is accessed. "
    "All API calls are made from the business owner's local machine using their own credentials.", body_style))

content.append(Paragraph("5. Users", h2_style))
content.append(Paragraph(
    "This tool is for internal use only. The sole user is the business owner (Ahmet Şemsettin Özdemirden, "
    "info@inanctekstil.store). There are no external users, no clients, and no public-facing interface.", body_style))

content.append(Paragraph("6. Data Storage and Security", h2_style))
content.append(Paragraph(
    "No Google Ads data is stored persistently outside of Google's own systems. "
    "The tool queries the API in real time and displays results to the business owner. "
    "OAuth2 credentials are stored locally in ~/google-ads.yaml on the owner's personal MacBook and are never shared. "
    "The MCP server runs only locally (127.0.0.1) and is not exposed to the internet.", body_style))

content.append(Paragraph("7. Compliance", h2_style))
content.append(Paragraph(
    "The tool is used solely for managing the advertiser's own campaigns in compliance with "
    "Google Ads API Terms of Service. It does not automate ad creation at scale, does not manage "
    "third-party accounts, and does not perform any activity that would violate Google's API policies.", body_style))

doc.build(content)
print(f"PDF created: {OUTPUT}")
