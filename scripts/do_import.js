const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const tenantId = 'fc54a71d-b25e-4cf7-b9a0-d01ae41cd634';
const stageId = 'c88fba21-3c33-4199-8c69-bcfc2adf1dc5';

const leads = [];

fs.createReadStream('leads.csv')
    .pipe(csv())
    .on('data', (row) => {
        const rawName = row['Nome Completo'] || row['Nome Completo '] || '';
        const name = rawName.trim();
        if (!name) return; // Skip empty rows

        const phone = (row['WhatsApp'] || '').trim();
        const email = (row['E-mail'] || '').trim();

        leads.push({
            tenant_id: tenantId,
            name,
            email,
            phone,
            current_stage_id: stageId,
            lead_score: 10
        });
    })
    .on('end', async () => {
        console.log(`Starting import of ${leads.length} leads...`);
        let i = 0;
        while (i < leads.length) {
            const chunk = leads.slice(i, i + 100);
            const { error } = await supabase.from('leads').insert(chunk);
            if (error) {
                console.error('Error inserting chunk:', error);
                break;
            }
            i += 100;
            console.log(`Inserted ${i} / ${leads.length}`);
        }
        console.log('Import done!');
    });
