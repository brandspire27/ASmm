from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    # Step 1: Navigate to login
    print("Navigating to login page...")
    page.goto("http://localhost:3002/login")
    page.wait_for_timeout(1000)

    # Fill out login credentials
    print("Signing in with agency email...")
    page.get_by_placeholder("architect@agency.internal").fill("architect@agency.internal")
    page.wait_for_timeout(500)
    page.get_by_placeholder("••••••••").fill("supersecretagencykey")
    page.wait_for_timeout(500)
    page.get_by_role("button", name="Enter OS Workspace").click()
    page.wait_for_timeout(2000)

    # Step 2: Dashboard overview
    print("Reviewing Dashboard Overview...")
    page.wait_for_timeout(1000)
    # Take initial dashboard screenshot
    page.screenshot(path="/app/verification/screenshots/dashboard.png")

    # Step 3: Go to AI Router configuration
    print("Navigating to AI Router Chains...")
    page.get_by_role("link", name="AI Router").click()
    page.wait_for_timeout(1000)
    page.screenshot(path="/app/verification/screenshots/ai_router.png")

    # Step 4: Go to Content Generator
    print("Navigating to Content Generator...")
    page.get_by_role("link", name="Content Generator").click()
    page.wait_for_timeout(1000)
    
    # Fill out prompt
    page.get_by_placeholder("Specify key themes, call to action requirements, or").fill("Superb pre-commit check verification is successfully complete!")
    page.wait_for_timeout(500)
    
    print("Triggering AI Content generation...")
    page.get_by_role("button", name="Generate with active router:").click()
    page.wait_for_timeout(2500) # Wait for simulation delay
    page.screenshot(path="/app/verification/screenshots/content_generator.png")

    # Approve generated asset
    print("Approving generated content copy...")
    page.get_by_role("button", name="Approve Asset").click()
    page.wait_for_timeout(1000)

    # Step 5: Go to Video Generator
    print("Navigating to Video Template Workspace...")
    page.get_by_role("link", name="Video Generator").click()
    page.wait_for_timeout(1000)
    
    # Choose story template
    print("Choosing Social Story vertical format...")
    page.get_by_role("button", name="Social Story").click()
    page.wait_for_timeout(1000)

    # Trigger render
    print("Triggering cloud template rendering pipeline...")
    page.get_by_role("button", name="Render MP4 using").click()
    page.wait_for_timeout(5000) # wait for multi-step pipeline rendering progress
    page.screenshot(path="/app/verification/screenshots/video_generator.png")

    # Step 6: Go to Social Approvals
    print("Navigating to Social Approvals...")
    page.get_by_role("link", name="Approvals").click()
    page.wait_for_timeout(1000)
    
    # Dispatch asset to social network
    print("Dispatching post to LinkedIn...")
    page.get_by_role("button", name="Dispatch to LinkedIn").first.click()
    page.wait_for_timeout(2000)
    page.screenshot(path="/app/verification/screenshots/social_approvals.png")

    # Step 7: Go to Analytics Reports
    print("Reviewing Performance Analytics...")
    page.get_by_role("link", name="Performance").click()
    page.wait_for_timeout(1000)
    
    # Simulate dynamic engagement increment
    print("Simulating traffic increases...")
    page.get_by_role("button", name="Simulate Traffic Increase").click()
    page.wait_for_timeout(1500)
    page.screenshot(path="/app/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

    print("Verification journey complete.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/app/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
