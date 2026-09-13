import { test, expect } from '@playwright/test';

test('完整叙事链、主题记忆、翻页、预览与键盘返回', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page).toHaveTitle('个人3D交互简历网站');
  await expect(page.getByRole('heading', { name: /把想法，\s*贴在纸上。/ })).toBeVisible();
  await page.getByRole('button', { name: '切换红黑主题' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: '切换暖灰主题' }).click();
  await page.locator('.role-notes a').nth(2).click();
  await expect(page.locator('#chapter-2')).toBeInViewport();
  await expect(page.locator('.role-notes a').nth(2)).toHaveAttribute('aria-current', 'step');
  await page.locator('#chapter-2').getByRole('button', { name: '查看项目' }).click();
  await expect(page.locator('#chapter-2').getByRole('heading', { name: '折叠实验' })).toBeVisible();
  await page.locator('#chapter-2').getByRole('button', { name: '打开项目预览' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('#chapter-2').getByRole('button', { name: '打开项目预览' })).toBeFocused();
  await page.locator('#chapter-2').getByRole('button', { name: '返回叙事' }).click();
  await expect(page.locator('#chapter-2').getByRole('heading', { name: '让结构会呼吸' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('桌面画廊滚轮、按钮、键盘、端点放行与截图', async ({ page }) => {
  const errors = [], requests = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('request', r => requests.push(r.url()));
  await page.goto('/');
  await expect(page.locator('.character')).toHaveClass(/is-live/);
  await page.screenshot({ animations: 'disabled', path: '/tmp/paper-template-desktop-light.png' });
  await page.getByRole('button', { name: '切换红黑主题' }).click();
  await page.screenshot({ animations: 'disabled', path: '/tmp/paper-template-desktop-dark.png' });
  await page.getByRole('button', { name: '切换暖灰主题' }).click();
  await page.getByRole('navigation', { name: '页面导航' }).getByRole('link', { name: '画廊' }).click();
  const rail = page.getByLabel('作品画廊');
  await expect(rail).toBeInViewport();
  await rail.hover();
  await page.mouse.wheel(0, 600);
  await expect(page.getByTestId('gallery-count')).toHaveText('02 / 05');
  await page.getByRole('button', { name: '下一个作品' }).click();
  await expect(page.getByTestId('gallery-count')).toHaveText('03 / 05');
  await rail.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByTestId('gallery-count')).toHaveText('02 / 05');
  await page.getByRole('button', { name: '预览形状档案' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement.closest('dialog'))).toBeTruthy();
  await page.screenshot({ animations: 'disabled', path: '/tmp/paper-template-preview.png' });
  await page.getByRole('button', { name: '关闭预览' }).click();
  await expect(page.getByRole('button', { name: '预览形状档案' })).toBeFocused();
  await page.screenshot({ animations: 'disabled', path: '/tmp/paper-template-gallery.png' });
  await rail.evaluate(el => el.scrollLeft = el.scrollWidth);
  await expect(page.getByTestId('gallery-count')).toHaveText('05 / 05');
  const y = await page.evaluate(() => scrollY);
  await rail.hover(); await page.mouse.wheel(0, 350);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  expect(requests.filter(url => !url.startsWith('http://127.0.0.1:5187/'))).toEqual([]);
  expect(errors).toEqual([]);
});

test('五张纸张均可翻页并返回，滚动同步对应便签', async ({ page }) => {
  await page.goto('/');
  for (let i = 0; i < 5; i++) {
    await page.locator('.role-notes a').nth(i).click();
    const section = page.locator(`#chapter-${i}`);
    await expect(section).toBeInViewport();
    await expect(page.locator('.role-notes a').nth(i)).toHaveAttribute('aria-current', 'step');
    await section.getByRole('button', { name: '查看项目' }).click();
    await expect(section.getByRole('button', { name: '打开项目预览' })).toBeVisible();
    if (i === 0) await page.screenshot({ animations: 'disabled', path: '/tmp/paper-template-story.png' });
    await section.getByRole('button', { name: '返回叙事' }).click();
    await expect(section.getByRole('button', { name: '查看项目' })).toBeVisible();
  }
  await page.getByRole('link', { name: '返回首屏' }).click();
  await expect(page.locator('#home')).toBeInViewport();
});

test('窄屏纵向画廊、静态角色、预览与无横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests = [];
  page.on('request', r => requests.push(r.url()));
  await page.goto('/');
  await expect(page.locator('.character')).toHaveClass(/is-static/);
  await page.screenshot({ animations: 'disabled', path: '/tmp/paper-template-mobile.png', fullPage: true });
  for (const id of ['home', 'chapter-0', 'chapter-4', 'gallery', 'capabilities', 'ending']) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  }
  const cards = await page.locator('.gallery-card').evaluateAll(nodes => nodes.map(el => el.getBoundingClientRect().top));
  expect(cards.every((top, i) => i === 0 || top > cards[i - 1])).toBeTruthy();
  await page.getByRole('button', { name: '预览留白计划' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: '关闭预览' }).click();
  expect(requests.some(url => /three/.test(url))).toBeFalsy();
});

test('减少动态、存储不可用和背景关闭', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Storage disabled'); };
    Storage.prototype.setItem = () => { throw new Error('Storage disabled'); };
  });
  await page.goto('/');
  await expect(page.locator('.character')).toHaveClass(/is-static/);
  await page.getByRole('button', { name: '切换红黑主题' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.locator('.scroll-note i').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await page.locator('.role-notes a').nth(0).click();
  await page.locator('#chapter-0').getByRole('button', { name: '查看项目' }).click();
  await page.locator('#chapter-0').getByRole('button', { name: '打开项目预览' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('WebGL 不可用时仍有静态角色与可操作便签', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return type.startsWith('webgl') ? null : original.call(this, type, ...args);
    };
  });
  await page.goto('/');
  await expect(page.locator('.character')).toHaveClass(/is-static/);
  await page.locator('.role-notes a').nth(1).click();
  await expect(page.locator('#chapter-1')).toBeInViewport();
});
