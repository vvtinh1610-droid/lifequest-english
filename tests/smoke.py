"""Chạy thử nhanh toàn bộ luồng chơi bằng trình duyệt ẩn (Playwright).
Chạy: python3 tests/smoke.py   → ảnh chụp lưu ở tests/shots/
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT / "tests" / "shots"
SHOTS.mkdir(parents=True, exist_ok=True)
URL = (ROOT / "index.html").as_uri()
errors = []


def shot(page, name):
    page.screenshot(path=str(SHOTS / f"{name}.png"), full_page=True)


def click(page, sel, n=0):
    page.locator(sel).nth(n).click()
    page.wait_for_timeout(120)


with sync_playwright() as p:
    chrome = "/usr/bin/google-chrome"  # Linux; trên Windows để Playwright tự dùng Chromium của nó
    b = p.chromium.launch(executable_path=chrome, args=["--no-sandbox"]) if pathlib.Path(chrome).exists() else p.chromium.launch()
    page = b.new_page(viewport={"width": 390, "height": 844})
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
    page.goto(URL)
    page.wait_for_timeout(400)
    shot(page, "01-welcome")

    click(page, '[data-act="toCreate"]')
    page.fill("#cr-name", "Tinh")
    click(page, '[data-act="crSet"][data-k="gender"][data-v="m"]')
    click(page, '[data-act="crSet"][data-k="look"][data-v="asia"]')
    click(page, '[data-act="crSet"][data-k="personality"][data-v="funny"]')
    shot(page, "02-create")
    click(page, '[data-act="crDone"]')
    shot(page, "03-placement-intro")
    click(page, '[data-act="ptStart"]')
    shot(page, "04-placement-q")
    # Trả lời đúng hết để kiểm tra lên bậc
    for _ in range(20):
        if page.locator('[data-act="ptAnswer"]').count() == 0:
            break
        # chọn đáp án đúng bằng dữ liệu
        idx = page.evaluate("LQ.ptCurrent().answer")  # đáp án đã được xáo, lấy từ câu đang hiện
        click(page, '[data-act="ptAnswer"]', idx)
        click(page, '[data-act="ptNext"]')
    shot(page, "05-placement-result")
    # Bảng hướng dẫn lần đầu: chỉ để lại của Hầm mỏ, các khu khác coi như đã xem
    page.evaluate("Object.assign(LQ.state.seenIntro, {map: true, market: true, job: true, home: true}); LQ.save()")
    click(page, '[data-act="introStory"]')
    page.wait_for_timeout(200)
    shot(page, "06-first-quest")
    if page.locator('[data-act="closeAndQuests"]').count():
        click(page, '[data-act="closeAndQuests"]')
    shot(page, "07-quests")
    click(page, '#nav [data-to="map"]')
    shot(page, "08-map")

    # Hầm mỏ: chạm tảng đá để nhân vật chạy tới, rồi bấm nút ĐÀO
    click(page, '[data-act="enterRegion"][data-id="dig"]')
    page.wait_for_timeout(400)
    if page.locator('#modal-root .guide').count():
        shot(page, "09-guide-dig")
        click(page, '[data-act="guideOk"]')
    page.locator('.mine-grid .rock:not(.gone)').first.click()
    page.wait_for_timeout(400)
    for k in range(40):
        if page.locator('#modal-root .modal').count():
            if k < 6:
                shot(page, f"09-wordcard-{k}")
            click(page, '#modal-root [data-act="closeAfter"], #modal-root [data-act="close"], #modal-root [data-act="closeAndQuests"], #modal-root [data-act="guideOk"]')
            if page.locator('#modal-root .modal').count():
                page.evaluate("LQ.closeModal()")
            if page.evaluate("LQ.current.name") != "dig":
                page.evaluate("LQ.go('dig')")
        if page.locator('.mine-grid .rock:not(.gone)').count() == 0:
            page.wait_for_timeout(1900)
            continue
        page.locator('[data-act="digNow"]').click()
        page.wait_for_timeout(420)
    shot(page, "10-dig")

    # Nâng cấp nhanh để thử các vùng sau
    page.evaluate("LQ.closeModal(); LQ.state.level = 9; LQ.state.money = 500; LQ.state.energy = 100; LQ.save(); LQ.go('market')")
    shot(page, "11-market")
    for _ in range(4):
        if page.locator('[data-act="mkSell"]').count() == 0:
            break
        # bán đúng món: tìm id khách cần qua trạng thái nội bộ không lộ ra → thử từng món
        n = page.locator('[data-act="mkSell"]').count()
        sold = False
        for i in range(n):
            before = page.evaluate("LQ.state.stats.sells")
            if page.locator('[data-act="mkSell"]').count() <= i:
                break
            page.locator('[data-act="mkSell"]').nth(i).click()
            page.wait_for_timeout(700)
            if page.evaluate("LQ.state.stats.sells") > before:
                sold = True
                break
        page.evaluate("LQ.closeModal()")
    shot(page, "12-market-after")
    click(page, '[data-act="mkTab"][data-t="food"]')
    page.evaluate("LQ.state.energy = 20; LQ.render()")
    click(page, '[data-act="buyFood"]', 1)
    shot(page, "13-food")

    # Ca nhà hàng
    page.evaluate("LQ.go('job', {job: 'restaurant'})")
    shot(page, "14-job-intro")
    click(page, '[data-act="startShift"]')
    for k in range(10):
        if page.locator('[data-act="quizAnswer"]').count() == 0:
            break
        if k == 0:
            shot(page, "15-quiz-q")
        click(page, '[data-act="quizAnswer"]', 0)
        if k == 0:
            shot(page, "16-quiz-feedback")
        click(page, '[data-act="quizNext"]')
    shot(page, "17-quiz-summary")
    click(page, '[data-act="quizDone"]')
    page.wait_for_timeout(200)
    shot(page, "18-after-shift")
    page.evaluate("LQ.closeModal()")

    # Lên cấp 10 → chọn môn phái
    page.evaluate("LQ.addXP(400); LQ.render(); LQ.afterAction()")
    page.wait_for_timeout(300)
    shot(page, "19-sect")
    if page.locator('[data-act="joinSect"]').count():
        click(page, '[data-act="joinSect"]', 1)
    page.evaluate("LQ.closeModal()")

    # Ca giao hàng
    page.evaluate("LQ.state.energy = 100; LQ.go('job', {job: 'delivery'})")
    click(page, '[data-act="startShift"]')
    for k in range(10):
        if page.locator('[data-act="quizAnswer"]').count() == 0:
            break
        click(page, '[data-act="quizAnswer"]', 1)
        click(page, '[data-act="quizNext"]')
    click(page, '[data-act="quizDone"]')
    page.evaluate("LQ.closeModal()")

    for name in ["review", "quests", "wordbook", "profile"]:
        page.evaluate(f"LQ.closeModal(); LQ.go('{name}')")
        page.wait_for_timeout(150)
        shot(page, f"20-{name}")
    page.evaluate("LQ.go('home')")
    shot(page, "21-home")

    # Tải lại trang: dữ liệu còn không?
    page.reload()
    page.wait_for_timeout(400)
    lvl = page.evaluate("LQ.state.level")
    name = page.evaluate("LQ.state.player && LQ.state.player.name")
    shot(page, "22-reload")
    print("after reload: level", lvl, "name", name)
    b.close()

print("\n".join(errors) if errors else "NO JS ERRORS")
sys.exit(1 if errors else 0)
