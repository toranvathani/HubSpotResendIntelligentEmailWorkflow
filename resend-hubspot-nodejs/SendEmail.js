require("dotenv").config();
const axios = require("axios");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// 1. Fetch contacts from HubSpot
async function getContacts() {
  try {
    const response = await axios.get(
      "https://api.hubapi.com/crm/v3/objects/contacts",
      {
        headers: {
          Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        params: {
          limit: 5,
          properties: "firstname,email,company,jobtitle",
        },
      }
    );

    console.log(`Fetched ${response.data.results.length} contacts`);
    return response.data.results;

  } catch (error) {
    console.error("HubSpot Fetch Error:", error.response?.data || error.message);
    return [];
  }
}

// 2. Send email via Resend (Tracking + Tags enabled)
async function sendEmail(contact) {
  const email = contact.properties.email;
  const firstName = contact.properties.firstname || "there";
  const company = contact.properties.company || "your company";

  try {
    const response = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: `Quick hello ${firstName} 👋`,
      html: `
        <p>Hi ${firstName},</p>
        <p>I noticed you’re working at <strong>${company}</strong>.</p>
        <p>This email was automatically generated using HubSpot + Resend integration.</p>
        <p>Looking forward to connecting!</p>
        <br/>
        <p>Best,<br/>Toran</p>
      `,
      tags: [
        { name: "campaign", value: "hubspot-automation-v1" },
        { name: "source", value: "hubspot-crm" }
      ],
    });

    console.log(`✅ Email sent to: ${email}`);
    console.log(`📊 Resend Email ID: ${response.data?.id}`);
    console.log("--------------------------------------------------");

  } catch (error) {
    console.error(`❌ Failed sending to ${email}:`, error.message);
  }
}

//  3. Main execution flow
async function main() {
  console.log("🚀 Starting automation...\n");

  const contacts = await getContacts();

  if (contacts.length === 0) {
    console.log("No contacts found.");
    return;
  }

  for (const contact of contacts) {
    if (contact.properties.email) {
      await sendEmail(contact);
    }
  }

  console.log("\n🎉 Automation completed.");
}

main();
