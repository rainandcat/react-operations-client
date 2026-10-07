export interface DemoClientSession {
  account: string;
  displayName: string;
}

export function authenticateDemoClient(
  account: string,
  passcode: string
): DemoClientSession | null {
  if (account.trim().toLowerCase() !== 'member@demo.invalid' || passcode !== 'demo123') return null;
  return { account: 'member@demo.invalid', displayName: 'Alex Morgan' };
}
