export async function loginWithCredentials(page, { email, password }) {
  const loginTab = page.getByRole('tab', { name: /login/i });
  if (await loginTab.isVisible().catch(() => false)) {
    await loginTab.click();
  }

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /log in/i }).click();
}
