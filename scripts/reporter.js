import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY; // OR SERVICE_ROLE_KEY for better access if needed, but anon works for read if policy allows or we use service role
// Note: For reading all data for report, we strictly need SERVICE_ROLE_KEY if RLS blocks read.
// OR we can adjust RLS to allow read for a specific service user.
// FOR SIMPLICITY: We will assume the user creates a SERVICE_ROLE_KEY in `.env` for the reporter script.
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;
const CLIENT_ID = process.env.PUBLIC_CLIENT_ID || 'grand-avenue';

// Email Config
const EMAIL_FROM = process.env.EMAIL_FROM || 'reporter@antigravity.com';
const EMAIL_TO = process.env.EMAIL_TO || 'ditoaryap.work@gmail.com';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SMTP_USER || !SMTP_PASS) {
    console.error('Missing Config: Check .env for SUPABASE_URL, SUPABASE_SERVICE_KEY, SMTP_USER, SMTP_PASS');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function generateReport() {
    console.log(`Generating Report for Client: ${CLIENT_ID}...`);
    const start = new Date();
    start.setDate(start.getDate() - 7); // Last 7 days
    const startDate = start.toISOString();

    // 1. Get Total Views
    const { count: viewCount, error: viewError } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', CLIENT_ID)
        .gte('created_at', startDate);

    if (viewError) throw viewError;

    // 2. Get Events (Clicks)
    const { data: events, error: eventError } = await supabase
        .from('events')
        .select('name, details')
        .eq('client_id', CLIENT_ID)
        .gte('created_at', startDate);

    if (eventError) throw eventError;

    // Aggregate Events
    const eventSummary = events.reduce((acc, curr) => {
        const key = `${curr.name} (${curr.details})`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    // 3. Get Top Pages
    const { data: pages } = await supabase
        .from('page_views')
        .select('path')
        .eq('client_id', CLIENT_ID)
        .gte('created_at', startDate);

    const pageSummary = pages?.reduce((acc, curr) => {
        acc[curr.path] = (acc[curr.path] || 0) + 1;
        return acc;
    }, {}) || {};

    const topPages = Object.entries(pageSummary)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    // 4. Send Email
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    });

    const htmlContent = `
        <div style="font-family: sans-serif; color: #333;">
            <h2 style="color: #10b981;">📊 Weekly Report: Grand Avenue</h2>
            <p>Periode: Last 7 Days</p>
            <hr>
            <h3>🔥 Highlight</h3>
            <ul>
                <li><strong>${viewCount}</strong> Total Visitors</li>
                <li><strong>${events.length}</strong> Total Interactions (Clicks)</li>
            </ul>

            <h3>🎯 Conversions (Leads)</h3>
            <ul>
                ${Object.entries(eventSummary).map(([k, v]) => `<li>${k}: <strong>${v}</strong></li>`).join('')}
            </ul>

            <h3>🏠 Top Pages</h3>
             <ul>
                ${topPages.map(([k, v]) => `<li>${k}: <strong>${v} views</strong></li>`).join('')}
            </ul>
        </div>
    `;

    await transporter.sendMail({
        from: EMAIL_FROM,
        to: EMAIL_TO,
        subject: `Weekly Report - Grand Avenue`,
        html: htmlContent
    });

    console.log('Report Sent Successfully to', EMAIL_TO);
}

generateReport().catch(console.error);
