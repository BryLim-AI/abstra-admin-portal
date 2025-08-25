import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { page, feedback, type  } = JSON.parse(req.body);

  try {
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Page: {
          title: [
            {
              text: {
                content: page,
              },
            },
          ],
        },
         Type: {
          select: { name: type }, // Make sure the Notion DB has this select option
        },
        Feedback: {
          rich_text: [
            {
              text: {
                content: feedback,
              },
            },
          ],
        },
        'Submitted At': {
          date: {
            start: new Date().toISOString(),
          },
        },
      },
    });

    res.status(200).json({ message: 'Feedback Saved, Thank you!' });
  } catch (err: any) {
    console.error('Notion error:', err);
    res.status(500).json({ error: 'Failed to save to Notion' });
  }
}
