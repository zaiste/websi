import { assertEquals, assertExists, assertNotEquals } from "testing/asserts.ts";
import { Router } from "./mod.ts";

Deno.test('static lookup', async (t) => {
  const router = new Router<string>()

  router.add('GET', '/foo', 'foo via GET');
  router.add('POST', '/foo', 'foo via POST');

  await t.step("GET /foo", () => {
    const route = router.find('GET', '/foo')

    assertExists(route);

    assertEquals(route.handler, 'foo via GET');
    assertNotEquals(route.handler, 'bar');
  })

  await t.step('POST /foo', () => {
    const route = router.find('POST', '/foo')

    assertExists(route);

    assertEquals(route.handler, 'foo via POST');
    assertNotEquals(route.handler, 'bar');
  })

  await t.step('Not found', () => {
    const route = router.find('GET', '/bar')

    assertEquals(route, null);
  })
});

Deno.test('lookup order with dynamic pathnames', async (t) => {
  const router = new Router<string>()

  router.add('GET', '/welcome/zaiste', 'welcome zaiste')
  router.add('GET', '/welcome/:name', 'welcome somebody')
  router.add('GET', '/welcome/krysia', 'welcome krysia')

  await t.step('GET /welcome/zaiste', () => {
    const route = router.find('GET', '/welcome/zaiste')

    assertExists(route);
    assertEquals(route.handler, 'welcome zaiste');
    assertEquals(route.params, {});
  })

  await t.step('GET /welcome/antek', () => {
    const route = router.find('GET', '/welcome/antek')

    assertExists(route);
    assertEquals(route.handler, 'welcome somebody');
    assertEquals(route.params, { name: 'antek' });
  })

  await t.step('GET /welcome/krysia', () => {
    const route = router.find('GET', '/welcome/krysia')

    assertExists(route);
    assertEquals(route.handler, 'welcome somebody');
    assertEquals(route.params, { name: 'krysia' });
  })
});

Deno.test('lookup order with dynamic & nested pathnames', async (t) => {
  const router = new Router<string>()

  router.add('GET', '/welcome/:name', 'welcome somebody')
  router.add('GET', '/welcome/:name/invite', 'welcome and invite somebody')

  await t.step('GET /welcome/zaiste', () => {
    const route = router.find('GET', '/welcome/zaiste')

    assertExists(route);
    assertEquals(route.handler, 'welcome somebody');
    assertEquals(route.params, { name: 'zaiste' });
  })

  await t.step('GET /welcome/zaiste/invite', () => {
    const route = router.find('GET', '/welcome/zaiste/invite')

    assertExists(route);
    assertEquals(route.handler, 'welcome and invite somebody');
    assertEquals(route.params, { name: 'zaiste' });
  })
});