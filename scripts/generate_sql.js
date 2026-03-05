const fs = require('fs');
const csv = require('csv-parser');

const tenantId = 'fc54a71d-b25e-4cf7-b9a0-d01ae41cd634';
const stageId = 'c88fba21-3c33-4199-8c69-bcfc2adf1dc5';

const leads = [];

fs.createReadStream('leads.csv')
    .pipe(csv())
    .on('data', (row) => {
        // CSV columns shown earlier: 
        // "Nome Completo", "WhatsApp", "E-mail", "Faturamento", etc...
        const rawName = row['Nome Completo'] || row['Nome Completo '] || '';
        const name = rawName.trim().replace(/'/g, "''");

        if (!name) return; // Skip empty rows

        const phone = (row['WhatsApp'] || '').trim().replace(/'/g, "''");
        const email = (row['E-mail'] || '').trim().replace(/'/g, "''");

        leads.push(`('${tenantId}', '${name}', '${email}', '${phone}', '${stageId}', 10)`);
    })
    .on('end', () => {
        const header = `INSERT INTO leads (tenant_id, name, email, phone, current_stage_id, lead_score) VALUES\n`;
        const chunks = [];
        let i = 0;
        // Chunking to avoid massive single insert just in case
        while (i < leads.length) {
            const chunk = leads.slice(i, i + 500);
            chunks.push(header + chunk.join(',\n') + ';');
            i += 500;
        }

        fs.writeFileSync('insert_leads.sql', chunks.join('\n\n'));
        console.log('SQL generated!');
    });
