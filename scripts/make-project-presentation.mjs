import pptxgen from 'pptxgenjs';

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'NammaPower';
pptx.subject = 'NammaPower project overview';
pptx.title = 'NammaPower: A simple guide';
pptx.company = 'NammaPower';
pptx.lang = 'en-US';
pptx.theme = {
  headFontFace: 'Aptos Display',
  bodyFontFace: 'Aptos',
  lang: 'en-US'
};
pptx.defineSlideMaster({
  title: 'MASTER',
  background: { color: 'F7F9FC' },
  objects: [
    { rect: { x: 0, y: 7.18, w: 13.33, h: 0.32, fill: { color: '0F1B2D' }, line: { color: '0F1B2D' } } },
    { text: { text: 'NammaPower | Project overview', options: { x: 0.45, y: 7.25, w: 4, h: 0.12, fontFace: 'Aptos', fontSize: 8, color: 'B8C4D6', margin: 0 } } }
  ],
  slideNumber: { x: 12.55, y: 7.23, color: 'B8C4D6', fontFace: 'Aptos', fontSize: 8 }
});

const C = { navy: '0F1B2D', blue: '2563EB', teal: '0EA5A4', green: '10B981', amber: 'F59E0B', red: 'EF4444', ink: '14213D', muted: '667085', line: 'D9E1EC', paleBlue: 'EAF2FF', paleTeal: 'E8FAF5', paleAmber: 'FFF6DD', white: 'FFFFFF' };
const icon = (slide, text, x, y, color = C.blue, size = 22) => slide.addText(text, { x, y, w: 0.45, h: 0.38, fontSize: size, bold: true, color, align: 'center', margin: 0 });
const title = (slide, kicker, heading, sub = '') => {
  slide.addText(kicker.toUpperCase(), { x: 0.6, y: 0.42, w: 5.8, h: 0.22, fontSize: 10, bold: true, color: C.blue, charSpacing: 1.3, margin: 0 });
  slide.addText(heading, { x: 0.6, y: 0.72, w: 11.8, h: 0.65, fontSize: 29, bold: true, color: C.navy, margin: 0, breakLine: false, fit: 'shrink' });
  if (sub) slide.addText(sub, { x: 0.62, y: 1.42, w: 11.4, h: 0.35, fontSize: 13, color: C.muted, margin: 0, fit: 'shrink' });
};
const card = (slide, x, y, w, h, heading, body, color = C.blue, fill = C.white) => {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: C.line, width: 1 } });
  slide.addShape(pptx.ShapeType.rect, { x, y, w: 0.08, h, fill: { color }, line: { color } });
  slide.addText(heading, { x: x + 0.25, y: y + 0.2, w: w - 0.45, h: 0.3, fontSize: 16, bold: true, color: C.navy, margin: 0, fit: 'shrink' });
  slide.addText(body, { x: x + 0.25, y: y + 0.62, w: w - 0.45, h: h - 0.78, fontSize: 11.5, color: C.muted, breakLine: false, valign: 'top', margin: 0.02, fit: 'shrink' });
};
const bulletList = (slide, items, x, y, w, h, color = C.ink, size = 17) => slide.addText(items.map(t => ({ text: t, options: { bullet: { indent: 16 }, hanging: 3 } })), { x, y, w, h, fontSize: size, color, breakLine: true, paraSpaceAfterPt: 12, margin: 0.04, fit: 'shrink' });
const arrow = (slide, x, y, w = 0.7) => slide.addShape(pptx.ShapeType.chevron, { x, y, w, h: 0.34, fill: { color: C.teal }, line: { color: C.teal } });

// 1. Cover
{
  const s = pptx.addSlide('MASTER');
  s.background = { color: C.navy };
  s.addShape(pptx.ShapeType.arc, { x: 8.5, y: -1.3, w: 6.1, h: 6.1, adjustPoint: 0.25, line: { color: C.teal, width: 2, transparency: 20 }, fill: { color: C.navy, transparency: 100 } });
  s.addShape(pptx.ShapeType.arc, { x: 9.5, y: 1.2, w: 4.6, h: 4.6, line: { color: C.blue, width: 18, transparency: 15 }, fill: { color: C.navy, transparency: 100 } });
  s.addShape(pptx.ShapeType.roundRect, { x: 0.78, y: 0.82, w: 0.8, h: 0.8, rectRadius: 0.16, fill: { color: C.teal }, line: { color: C.teal } });
  s.addText('N', { x: 0.78, y: 0.91, w: 0.8, h: 0.5, fontSize: 30, bold: true, color: C.white, align: 'center', margin: 0 });
  s.addText('NammaPower', { x: 1.78, y: 0.95, w: 4, h: 0.38, fontSize: 22, bold: true, color: C.white, margin: 0 });
  s.addText('A simple guide to the project', { x: 0.82, y: 2.06, w: 7.2, h: 0.75, fontSize: 34, bold: true, color: C.white, margin: 0, fit: 'shrink' });
  s.addText('A privacy-first electricity companion for Bengaluru households.', { x: 0.86, y: 3.02, w: 5.8, h: 0.6, fontSize: 18, color: 'D2DEEF', margin: 0, fit: 'shrink' });
  s.addText('What it does | How it works | Who can access what', { x: 0.86, y: 5.9, w: 7, h: 0.28, fontSize: 12, color: '9FB2CC', margin: 0 });
}

// 2. Problem
{
  const s = pptx.addSlide('MASTER'); title(s, '01 | The problem', 'Electricity decisions are harder than they should be', 'People need one calm place to understand bills, outages, and energy use.');
  card(s, 0.6, 2.15, 3.8, 2.5, 'Bills feel opaque', 'Tariff slabs, surcharges, duties, and government schemes are difficult to calculate by hand.', C.amber, C.paleAmber); icon(s, '₹', 3.75, 2.35, C.amber, 25);
  card(s, 4.75, 2.15, 3.8, 2.5, 'Outages feel disconnected', 'Maintenance notices and crowd reports often live in different places and formats.', C.red, 'FFF0F0'); icon(s, '!', 7.9, 2.35, C.red, 25);
  card(s, 8.9, 2.15, 3.8, 2.5, 'Energy use is invisible', 'People know an appliance is running, but not always what it costs or when it becomes wasteful.', C.teal, C.paleTeal); icon(s, '⚡', 12.05, 2.35, C.teal, 23);
  s.addShape(pptx.ShapeType.roundRect, { x: 1.4, y: 5.35, w: 10.4, h: 0.78, rectRadius: 0.08, fill: { color: C.navy }, line: { color: C.navy } });
  s.addText('NammaPower turns scattered electricity information into practical next actions.', { x: 1.7, y: 5.58, w: 9.8, h: 0.3, fontSize: 18, bold: true, color: C.white, align: 'center', margin: 0 });
}

// 3. What it does
{
  const s = pptx.addSlide('MASTER'); title(s, '02 | The product', 'One workspace for everyday electricity decisions', 'The same domain experience is available on web and mobile.');
  const items = [
    ['Dashboard', 'See usage, cost, and important signals at a glance.', C.blue],
    ['Bills', 'Calculate bills and understand Gruha Jyothi impact.', C.green],
    ['Outage map', 'View subdivision risk, notices, and community reports.', C.red],
    ['Appliances', 'Track runtime and receive long-running alerts.', C.amber],
    ['Coach', 'Get practical advice for reducing waste and cost.', C.teal],
    ['Reports', 'Submit and review recent outage or voltage reports.', '7C3AED']
  ];
  items.forEach(([h,b,c], i) => { const x = 0.65 + (i % 3) * 4.18; const y = 2.1 + Math.floor(i / 3) * 2.15; card(s, x, y, 3.72, 1.65, h, b, c, C.white); });
}

// 4. User flow
{
  const s = pptx.addSlide('MASTER'); title(s, '03 | The user journey', 'From sign-in to a useful decision in minutes', 'The app is designed around repeated, practical workflows.');
  const steps = [['1', 'Sign in', 'Use an email and password.'], ['2', 'Choose an area', 'Pick the relevant subdivision.'], ['3', 'Understand', 'See bill, outage, and usage context.'], ['4', 'Act', 'Save a bill, report an issue, or change behavior.']];
  steps.forEach(([n,h,b], i) => { const x = 0.85 + i * 3.05; s.addShape(pptx.ShapeType.ellipse, { x, y: 2.35, w: 0.68, h: 0.68, fill: { color: i === 3 ? C.green : C.blue }, line: { color: i === 3 ? C.green : C.blue } }); s.addText(n, { x, y: 2.51, w: 0.68, h: 0.22, fontSize: 15, bold: true, color: C.white, align: 'center', margin: 0 }); s.addText(h, { x: x - 0.2, y: 3.35, w: 1.1, h: 0.3, fontSize: 16, bold: true, color: C.navy, align: 'center', margin: 0 }); s.addText(b, { x: x - 0.65, y: 3.8, w: 2, h: 0.55, fontSize: 11, color: C.muted, align: 'center', margin: 0, fit: 'shrink' }); if (i < 3) arrow(s, x + 1.25, 2.53, 0.9); });
  s.addShape(pptx.ShapeType.roundRect, { x: 2.05, y: 5.25, w: 9.2, h: 0.75, rectRadius: 0.06, fill: { color: C.paleBlue }, line: { color: 'C9DCFF' } });
  s.addText('The goal is not more data. The goal is better everyday decisions.', { x: 2.35, y: 5.5, w: 8.6, h: 0.25, fontSize: 17, bold: true, color: C.blue, align: 'center', margin: 0 });
}

// 5. Architecture
{
  const s = pptx.addSlide('MASTER'); title(s, '04 | How it works', 'A three-part system with one shared API', 'Web and mobile use the same backend rules and database.');
  const boxes = [['Web app', 'React + Vite\nBrowser experience', 0.75, 2.25, C.blue, C.paleBlue], ['Mobile app', 'React Native + Expo\nNative experience', 0.75, 4.35, C.teal, C.paleTeal], ['API', 'Node.js + Express\nAuth, tariff, reports', 5.15, 3.25, C.amber, C.paleAmber], ['Database', 'PostgreSQL\nUsers, sessions, energy data', 9.55, 3.25, C.green, C.paleTeal]];
  boxes.forEach(([h,b,x,y,c,f]) => { s.addShape(pptx.ShapeType.roundRect, { x, y, w: 2.9, h: 1.35, rectRadius: 0.08, fill: { color: f }, line: { color: c, width: 1.5 } }); s.addText(h, { x: x + 0.18, y: y + 0.2, w: 2.5, h: 0.3, fontSize: 17, bold: true, color: C.navy, align: 'center', margin: 0 }); s.addText(b, { x: x + 0.2, y: y + 0.6, w: 2.5, h: 0.5, fontSize: 11, color: C.muted, align: 'center', margin: 0, fit: 'shrink' }); });
  s.addShape(pptx.ShapeType.line, { x: 3.7, y: 2.92, w: 1.45, h: 0.75, line: { color: C.teal, width: 2, beginArrowType: 'none', endArrowType: 'triangle' } });
  s.addShape(pptx.ShapeType.line, { x: 3.7, y: 5.02, w: 1.45, h: -0.75, line: { color: C.teal, width: 2, beginArrowType: 'none', endArrowType: 'triangle' } });
  s.addShape(pptx.ShapeType.line, { x: 8.05, y: 3.92, w: 1.45, h: 0, line: { color: C.teal, width: 2, endArrowType: 'triangle' } });
}

// 6. Data / privacy
{
  const s = pptx.addSlide('MASTER'); title(s, '05 | Privacy by design', 'The system separates account identity from energy ownership', 'This reduces the amount of personal information the product needs.');
  card(s, 0.75, 2.1, 3.8, 2.8, 'Account identity', 'Email, hashed password, display name, role, and session token hash.', C.blue, C.paleBlue);
  card(s, 4.78, 2.1, 3.8, 2.8, 'Device-scoped data', 'Appliances, bills, alerts, and reports are fenced by a random device ID.', C.teal, C.paleTeal);
  card(s, 8.81, 2.1, 3.8, 2.8, 'Access boundary', 'Regular users manage their own data. Admin-only APIs expose platform controls.', C.amber, C.paleAmber);
  s.addText('No Aadhaar, voter ID, phone number, or consumer number is required.', { x: 1.2, y: 5.55, w: 10.8, h: 0.35, fontSize: 18, bold: true, color: C.navy, align: 'center', margin: 0 });
}

// 7. Auth and roles
{
  const s = pptx.addSlide('MASTER'); title(s, '06 | Access control', 'Two access levels, enforced in the API', 'The interface hides admin tools, but the backend is the final authority.');
  card(s, 1.0, 2.0, 5.2, 3.35, 'Basic member', 'Can:\n- View the product and local dashboard\n- Manage personal energy data\n- Update display name and profile photo\n- Submit permitted reports\n\nCannot:\n- Read user lists or platform metrics\n- Manage sessions or roles', C.blue, C.paleBlue);
  card(s, 7.1, 2.0, 5.2, 3.35, 'Administrator', 'Can do everything a member can do, plus:\n- View user accounts\n- View active sessions\n- Review platform report counts\n- Open the Admin dashboard\n\nEvery admin endpoint checks role=admin.', C.green, C.paleTeal);
}

// 8. Profile
{
  const s = pptx.addSlide('MASTER'); title(s, '07 | Profile experience', 'A profile that is useful without being invasive', 'Profile changes are saved to the account and reflected across authenticated sessions.');
  s.addShape(pptx.ShapeType.roundRect, { x: 1.0, y: 2.0, w: 5.1, h: 3.3, rectRadius: 0.08, fill: { color: C.white }, line: { color: C.line } });
  s.addShape(pptx.ShapeType.ellipse, { x: 1.45, y: 2.45, w: 1.2, h: 1.2, fill: { color: 'DCEAFF' }, line: { color: 'DCEAFF' } });
  s.addText('B', { x: 1.45, y: 2.79, w: 1.2, h: 0.32, fontSize: 28, bold: true, color: C.blue, align: 'center', margin: 0 });
  s.addText('admin@gmail.com', { x: 2.95, y: 2.6, w: 2.5, h: 0.3, fontSize: 16, bold: true, color: C.navy, margin: 0 });
  s.addText('Bhuvan B Krishna', { x: 2.95, y: 3.05, w: 2.5, h: 0.3, fontSize: 13, color: C.muted, margin: 0 });
  s.addShape(pptx.ShapeType.line, { x: 1.45, y: 4.1, w: 4.1, h: 0, line: { color: C.line } });
  s.addText('Display name  |  Profile photo  |  Access level', { x: 1.45, y: 4.45, w: 4.0, h: 0.25, fontSize: 12, color: C.muted, margin: 0 });
  bulletList(s, ['Saved through the authenticated profile API', 'Photo is resized before upload', 'Offline browser copy remains available'], 7.0, 2.35, 5.1, 2.6, C.ink, 17);
}

// 9. Admin
{
  const s = pptx.addSlide('MASTER'); title(s, '08 | Admin experience', 'Administrators see the platform, not just one device', 'The Admin tab is available only when the authenticated role is admin.');
  const metrics = [['1', 'Users', C.blue], ['24h', 'Reports', C.red], ['Live', 'Sessions', C.green]];
  metrics.forEach(([v,l,c], i) => { const x = 1.0 + i * 3.95; s.addShape(pptx.ShapeType.roundRect, { x, y: 2.15, w: 3.2, h: 1.35, rectRadius: 0.08, fill: { color: C.white }, line: { color: C.line } }); s.addText(v, { x: x + 0.2, y: 2.45, w: 1.2, h: 0.35, fontSize: 24, bold: true, color: c, margin: 0 }); s.addText(l, { x: x + 1.45, y: 2.5, w: 1.4, h: 0.25, fontSize: 13, color: C.muted, margin: 0 }); });
  card(s, 1.0, 4.15, 10.8, 1.25, 'Why this matters', 'A normal user cannot reach the admin data by changing the browser UI. The API checks the role and returns 403 when access is not allowed.', C.amber, C.paleAmber);
}

// 10. Technology
{
  const s = pptx.addSlide('MASTER'); title(s, '09 | Technology', 'Built as a practical full-stack monorepo', 'Each layer has a focused responsibility.');
  const tech = [
    ['Frontend', 'React, Vite, Leaflet', 'Fast responsive web dashboard'],
    ['Mobile', 'React Native, Expo', 'Native mobile workflows'],
    ['Backend', 'Node.js, Express', 'API, auth, validation, rate limits'],
    ['Data', 'PostgreSQL', 'RLS, user data, tariffs, sessions'],
    ['Quality', 'Node test, build checks', 'Repeatable validation before shipping']
  ];
  tech.forEach(([h,b,d], i) => { const y = 1.98 + i * 0.88; s.addText(h, { x: 1.0, y, w: 1.5, h: 0.25, fontSize: 15, bold: true, color: C.navy, margin: 0 }); s.addText(b, { x: 3.0, y, w: 3.1, h: 0.25, fontSize: 14, color: C.blue, bold: true, margin: 0 }); s.addText(d, { x: 6.65, y, w: 4.9, h: 0.25, fontSize: 13, color: C.muted, margin: 0 }); s.addShape(pptx.ShapeType.line, { x: 1.0, y: y + 0.48, w: 10.6, h: 0, line: { color: C.line, width: 0.8 } }); });
}

// 11. Demo script
{
  const s = pptx.addSlide('MASTER'); title(s, '10 | How to explain it live', 'A five-minute demo script', 'Use this sequence when introducing NammaPower to a new person.');
  const lines = [
    ['1', 'Start at login', 'Explain that accounts and roles control access.'],
    ['2', 'Show the dashboard', 'Point out that the app turns energy data into actions.'],
    ['3', 'Open Bills or Map', 'Demonstrate one concrete decision: cost or outage context.'],
    ['4', 'Open Settings', 'Change the display name or profile photo and save it.'],
    ['5', 'Show Admin', 'Explain that only the admin account sees platform-level data.']
  ];
  lines.forEach(([n,h,b], i) => { const y = 1.95 + i * 0.78; s.addShape(pptx.ShapeType.ellipse, { x: 1.0, y: y - 0.02, w: 0.43, h: 0.43, fill: { color: i === 4 ? C.green : C.blue }, line: { color: i === 4 ? C.green : C.blue } }); s.addText(n, { x: 1.0, y: y + 0.08, w: 0.43, h: 0.14, fontSize: 10, bold: true, color: C.white, align: 'center', margin: 0 }); s.addText(h, { x: 1.7, y, w: 2.5, h: 0.25, fontSize: 15, bold: true, color: C.navy, margin: 0 }); s.addText(b, { x: 4.3, y, w: 7.1, h: 0.25, fontSize: 13, color: C.muted, margin: 0 }); });
}

// 12. Closing
{
  const s = pptx.addSlide('MASTER');
  s.background = { color: C.navy };
  s.addText('NammaPower', { x: 0.8, y: 1.35, w: 5, h: 0.65, fontSize: 34, bold: true, color: C.white, margin: 0 });
  s.addText('A clearer way to understand and act on electricity data.', { x: 0.84, y: 2.3, w: 7.4, h: 0.5, fontSize: 21, color: 'D2DEEF', margin: 0 });
  s.addShape(pptx.ShapeType.roundRect, { x: 0.84, y: 4.25, w: 4.9, h: 0.78, rectRadius: 0.06, fill: { color: C.teal }, line: { color: C.teal } });
  s.addText('Understand  |  Decide  |  Save  |  Act', { x: 1.08, y: 4.52, w: 4.4, h: 0.25, fontSize: 16, bold: true, color: C.white, align: 'center', margin: 0 });
  s.addText('Questions?', { x: 9.4, y: 5.8, w: 2.8, h: 0.4, fontSize: 24, bold: true, color: C.white, align: 'right', margin: 0 });
}

await pptx.writeFile({ fileName: 'NammaPower-Project-Overview.pptx' });
