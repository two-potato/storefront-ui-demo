import subprocess
import time
import unittest
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

URL = "http://127.0.0.1:8000/"
ROOT = Path(__file__).resolve().parents[1]

class StorefrontTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = subprocess.Popen(["python3", "-m", "http.server", "8000", "--bind", "127.0.0.1"],
                                      cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        cls.addClassCleanup(cls.stop_server)
        for _ in range(50):
            if cls.server.poll() is not None:
                raise RuntimeError("HTTP server exited")
            try:
                urllib.request.urlopen(URL, timeout=1).close()
                break
            except OSError:
                time.sleep(.1)
        else:
            raise RuntimeError("HTTP server unavailable")
        cls.pw = sync_playwright().start()
        cls.addClassCleanup(cls.pw.stop)
        cls.browser = cls.pw.chromium.launch()
        cls.addClassCleanup(cls.browser.close)

    @classmethod
    def stop_server(cls):
        cls.server.terminate()
        try:
            cls.server.wait(5)
        except subprocess.TimeoutExpired:
            cls.server.kill()
            cls.server.wait()

    def setUp(self):
        self.context = self.browser.new_context(viewport={"width":1280,"height":900})
        self.addCleanup(self.context.close)
        self.page = self.context.new_page()
        self.errors = []
        self.page.on("pageerror", lambda e: self.errors.append(str(e)))
        self.page.route("**/*", lambda route: route.continue_() if route.request.url.startswith(URL) else route.abort())
        self.page.goto(URL)

    def tearDown(self):
        self.assertEqual(self.errors, [])

    def test_cart_persists_between_pages_and_removes_at_zero(self):
        slot = self.page.locator('[data-slot="MUG-300-MAT"]')
        slot.locator('[data-action=add]').click()
        slot.locator('[data-action=plus]').click()
        expect(self.page.locator("#cart-count")).to_have_text("2")
        self.page.goto(URL+"product.html")
        expect(slot.locator(".qty")).to_have_text("2")
        slot.locator('[data-action=minus]').click()
        slot.locator('[data-action=minus]').click()
        expect(slot.locator('[data-action=add]')).to_be_visible()
        expect(self.page.locator("#cart-count")).to_have_text("0")
        self.page.reload()
        expect(slot.locator('[data-action=add]')).to_be_visible()

    def test_malformed_state_recovers(self):
        for data in ["null", '{"items":null}', '{"items":{"MUG-300-MAT":{"qty":"9","price":2,"name":"x"}}}']:
            self.page.evaluate("(v)=>localStorage.setItem('cart.state.v1',v)", data)
            self.page.reload()
            expect(self.page.locator("#cart-count")).to_have_text("0")
        self.page.locator('[data-slot="MUG-300-MAT"] [data-action=add]').click()
        expect(self.page.locator("#cart-count")).to_have_text("1")

    def test_quantity_limit(self):
        self.page.evaluate("""()=>localStorage.setItem('cart.state.v1',JSON.stringify({items:{'MUG-300-MAT':{qty:98,name:'Sample',price:1}}}))""")
        self.page.reload()
        slot=self.page.locator('[data-slot="MUG-300-MAT"]')
        slot.locator('[data-action=plus]').click()
        expect(slot.locator(".qty")).to_have_text("99")
        expect(slot.locator('[data-action=plus]')).to_be_disabled()

    def test_product_mobile_single_column(self):
        self.page.set_viewport_size({"width":390,"height":844})
        self.page.goto(URL+"product.html")
        self.assertEqual(len(self.page.locator(".product-detail").evaluate("(e)=>getComputedStyle(e).gridTemplateColumns.split(' ')")),1)
        expect(self.page.locator('[data-slot="MUG-300-MAT"] [data-action=add]')).to_be_visible()

    def test_storage_write_failure_keeps_cart_usable(self):
        self.page.evaluate("()=>{Storage.prototype.setItem=()=>{throw Error('blocked')}}")
        self.page.locator('[data-slot="MUG-300-MAT"] [data-action=add]').click()
        expect(self.page.locator("#cart-count")).to_have_text("1")

if __name__ == "__main__":
    unittest.main()
