import { NextResponse } from 'next/server';

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID ?? '';
const REDIRECT_URI  = 'https://raxislab-os.vercel.app/api/auth/google-ads/callback';

const SCOPES = [
  'https://www.googleapis.com/auth/adwords',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/tagmanager.readonly',
  'https://www.googleapis.com/auth/tagmanager.edit.containers',
  'https://www.googleapis.com/auth/tagmanager.publish',
].join(' ');

export async function GET() {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id',     CLIENT_ID);
  url.searchParams.set('redirect_uri',  REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope',         SCOPES);
  url.searchParams.set('access_type',   'offline');
  url.searchParams.set('prompt',        'consent');

  return NextResponse.redirect(url.toString());
}
