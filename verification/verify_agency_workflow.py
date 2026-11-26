"""Read-only browser smoke test; use a disposable, preconfigured test workspace."""
import os
from playwright.sync_api import sync_playwright, expect


def main():
    email = os.environ.get('ASMM_TEST_EMAIL')
    password = os.environ.get('ASMM_TEST_PASSWORD')
    if not email or not password:
        raise SystemExit('Set ASMM_TEST_EMAIL and ASMM_TEST_PASSWORD locally.')
    base_url = os.environ.get('ASMM_TEST_URL', 'http://localhost:3000').rstrip('/')
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            page = browser.new_page()
            page.goto(base_url + '/login')
            page.locator('input[type=email]').fill(email)
            page.locator('input[type=password]').fill(password)
            page.get_by_role('button', name='Sign in', exact=True).click()
            page.wait_for_url('**/dashboard', timeout=30000)
            page.goto(base_url + '/approval')
            expect(page.get_by_role('heading', name='Approvals & Publishing Hub')).to_be_visible(timeout=30000)
            expect(page.get_by_role('heading', name='3. Legacy unverified records', exact=False)).to_be_visible()
            expect(page.get_by_role('button', name='Mark as Published')).to_have_count(0)
            print('Read-only approval UI smoke test passed.')
        finally:
            browser.close()


if __name__ == '__main__':
    main()
