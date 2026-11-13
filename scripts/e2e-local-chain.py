# Prueba end-to-end de la UI contra un nodo Hardhat local con chainId 43113 (imita Fuji).
# Requiere: `cd contracts && HARDHAT_CHAIN_ID=43113 npx hardhat node`, la app en :3000 y Chrome con CDP en :29229.
# Inyecta un proveedor EIP-1193 que firma con las cuentas de prueba públicas de Hardhat y redirige el RPC de Fuji al nodo local.
import asyncio, json
from playwright.async_api import async_playwright
SHIM = """
(() => {
  const RPC = 'http://127.0.0.1:8545';
  let id = 0;
  const rpc = async (method, params) => {
    const r = await fetch(RPC, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({jsonrpc:'2.0', id: ++id, method, params: params||[]})});
    const j = await r.json(); if (j.error) { const e = new Error(j.error.message); e.code = j.error.code; e.data = j.error.data; throw e; } return j.result;
  };
  window.__acct = Number(localStorage.getItem('__acct') || 0);
  window.ethereum = {
    isMetaMask: true,
    request: async ({method, params}) => {
      if (method === 'eth_requestAccounts' || method === 'eth_accounts') { const a = await rpc('eth_accounts'); return [a[window.__acct]]; }
      if (method === 'wallet_switchEthereumChain' || method === 'wallet_addEthereumChain') return null;
      return rpc(method, params);
    },
    on(){}, removeListener(){},
  };
})();
"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.connect_over_cdp("http://localhost:29229")
        ctx = await b.new_context(viewport={"width":1400,"height":900})
        await ctx.add_init_script(SHIM)
        async def fuji(route):
            r = await route.fetch(url="http://127.0.0.1:8545")
            await route.fulfill(response=r)
        await ctx.route("https://api.avax-test.network/**", fuji)
        pg = await ctx.new_page()
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        async def as_role(role, acct):
            await pg.evaluate(f"localStorage.setItem('__acct','{acct}')")
            await pg.reload(wait_until="networkidle")
            await pg.locator("header select").select_option(role)
            await pg.wait_for_timeout(300)
        await pg.goto("http://localhost:3000/estado", wait_until="networkidle")
        await as_role("admin", 0)
        await pg.get_by_role("button", name="Desplegar EvidenceRegistry en Fuji").click()
        await pg.get_by_text("Desplegado", exact=True).wait_for(timeout=20000)
        body = await pg.inner_text("body")
        await pg.fill("input[placeholder^='Dirección del verificador']", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8")
        await pg.get_by_role("button", name="Habilitar", exact=True).click()
        await pg.get_by_text("Habilitado (tx").wait_for(timeout=20000)
        await pg.get_by_role("button", name="Consultar", exact=True).click()
        await pg.get_by_text("Es verificador").wait_for(timeout=10000)
        print("verifier enabled: ok")
        await pg.screenshot(path="/tmp/e2e-estado.png", full_page=True)
        # empresa registra
        await pg.goto("http://localhost:3000/pasaporte", wait_until="networkidle")
        await as_role("empresa", 2)
        await pg.get_by_text("Usar informe demostrativo (PDF)").click()
        await pg.wait_for_timeout(800)
        await pg.get_by_role("button", name="Firmar y registrar en Fuji").click()
        await pg.get_by_text("Confirmada · bloque").first.wait_for(timeout=20000)
        href = await pg.locator("a[href*='/tx/']").first.get_attribute("href")
        print("tx link:", href)
        await pg.screenshot(path="/tmp/e2e-registro.png", full_page=True)
        # gobierno verifica y atesta
        await as_role("gobierno", 1)
        await pg.set_input_files("text=Elegir archivo a verificar >> input", "public/demo/informe-tecnico-demostrativo.pdf")
        await pg.get_by_text("Huella registrada on-chain").wait_for(timeout=10000)
        await pg.get_by_role("button", name="Atestar como contrastada").click()
        await pg.get_by_text("(contrastada)").wait_for(timeout=20000)
        print("attested: ok")
        await pg.screenshot(path="/tmp/e2e-verificacion.png", full_page=True)
        # archivo alterado
        open("/tmp/alterado.pdf","wb").write(open("public/demo/informe-tecnico-demostrativo.pdf","rb").read()+b" ")
        await pg.set_input_files("text=Elegir archivo a verificar >> input", "/tmp/alterado.pdf")
        await pg.get_by_text("No registrada en el contrato").wait_for(timeout=10000)
        print("tampered rejected: ok")
        # empresa intenta re-registrar
        await as_role("empresa", 2)
        await pg.get_by_text("Usar informe demostrativo (PDF)").click()
        await pg.wait_for_timeout(800)
        await pg.get_by_role("button", name="Firmar y registrar en Fuji").click()
        await pg.get_by_text("Esa huella ya fue registrada").wait_for(timeout=10000)
        print("duplicate blocked: ok")
        # autoatestación: empresa como verificador? gobierno acct2 (emisor)
        print("errors:", errs[:5])
        await ctx.close()
asyncio.run(main())
