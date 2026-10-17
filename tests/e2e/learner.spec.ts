import {test, expect, type Page} from '@playwright/test';

const fixture = 'http://127.0.0.1:54329';
async function checkWidths(page: Page) {
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({width, height: 900});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
}
async function login(page: Page, email = 'alice@example.test') {
  await page.goto('/auth/login');
  await page.getByLabel('Email', {exact: true}).fill(email);
  await page.getByLabel('Mật khẩu', {exact: true}).fill('Test-password-123');
  await page.getByRole('button', {name: 'Đăng nhập', exact: true}).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
async function startExam(page: Page) {
  await page.goto('/exams');
  const resume = page.getByRole('link', {name: 'Tiếp tục bài thi'});
  if (await resume.count()) {await resume.click();}
  else {
    await page.getByRole('button', {name: 'Bắt đầu làm bài'}).click();
    await page.getByRole('button', {name: 'Bắt đầu mini test'}).click();
  }
  await expect(page).toHaveURL(/\/attempt\//);
}
async function saved(page: Page) {await expect(page.getByRole('status')).toHaveText('Đã lưu');}

test('authentication routes, wrong credentials and safe return destination', async ({page}) => {
  await page.goto('/history');
  await expect(page).toHaveURL(/auth\/login\?next=%2Fhistory/);
  await checkWidths(page);
  await page.getByLabel('Email', {exact: true}).fill('bob@example.test');
  await page.getByLabel('Mật khẩu', {exact: true}).fill('Wrong-password');
  await page.getByRole('button', {name: 'Đăng nhập', exact: true}).click();
  await expect(page.locator('main').getByRole('alert')).toContainText('Email hoặc mật khẩu');
  await expect(page.getByLabel('Email', {exact: true})).toHaveValue('bob@example.test');
  await page.getByLabel('Mật khẩu', {exact: true}).fill('Test-password-123');
  await page.getByRole('button', {name: 'Đăng nhập', exact: true}).click();
  await expect(page).toHaveURL(/\/history$/);
  await expect(page.getByRole('heading', {name: 'Chưa có kết quả'})).toBeVisible();
  await page.getByRole('button', {name: 'Đăng xuất'}).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
  await page.goto('/auth/callback?token_hash=invalid&type=recovery');
  await expect(page).toHaveURL(/error=expired/);
  await expect(page.getByText('Liên kết không hợp lệ hoặc đã hết hạn.')).toBeVisible();
});

test('flashcards repeat unlearned words, resume and complete a five-question quiz', async ({page}) => {
  await login(page);
  await page.getByRole('link', {name: 'Từ vựng', exact: true}).click();
  await page.locator('.topic').filter({has: page.getByRole('heading', {name: 'Office & Business'})}).getByRole('button').click();
  await expect(page).toHaveURL(/\/study\//);
  const studyUrl = page.url();
  await checkWidths(page);
  await page.screenshot({path: 'test-results/screenshots/flashcard-desktop.png', fullPage: true});
  await page.getByRole('button', {name: 'Lật thẻ'}).click();
  await page.getByRole('button', {name: 'Chưa thuộc', exact: false}).click();
  await expect(page.getByRole('button', {name: 'Lật thẻ'})).toContainText('contract');
  await page.reload();
  await expect(page).toHaveURL(studyUrl);
  // The server retains the rating, so the unlearned word returns to the queue.
  for (let i = 0; i < 10; i++) {
    const currentWord = await page.locator('.flashcard h2').innerText();
    await page.getByRole('button', {name: 'Lật thẻ'}).click();
    await page.getByRole('button', {name: 'Đã thuộc', exact: false}).click();
    if (i < 9) await expect(page.locator('.flashcard h2')).not.toHaveText(currentWord);
  }
  await expect(page.getByRole('heading', {name: 'Quiz nhanh'})).toBeVisible();
  await checkWidths(page);
  await page.screenshot({path: 'test-results/screenshots/quiz-desktop.png', fullPage: true});
  for (let i = 0; i < 5; i++) {
    await page.locator('.answer').first().click();
    await page.getByRole('button', {name: i < 4 ? 'Tiếp tục' : 'Nộp quiz', exact: true}).click();
  }
  await expect(page.getByRole('heading', {name: 'Hoàn thành phiên học'})).toBeVisible();
  await checkWidths(page);
  await page.reload();
  await expect(page.getByRole('heading', {name: 'Hoàn thành phiên học'})).toBeVisible();
  await page.getByRole('link', {name: 'Về trang chủ'}).click();
  await expect(page.locator('.stat').filter({hasText: 'Từ vựng đã học'})).toContainText('10');
});

test('exam saves, resumes, handles failed saves and submits to review/history', async ({page, request}) => {
  await login(page);
  await startExam(page);
  await checkWidths(page);
  const attemptUrl = page.url();
  await page.locator('.answer').nth(0).click(); await saved(page);
  await page.locator('.answer').nth(1).click();
  await page.locator('.answer').nth(0).click(); await saved(page);
  await page.reload();
  await expect(page).toHaveURL(attemptUrl);
  await expect(page.locator('.answer').nth(0)).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', {name: 'Trang chủ', exact: true}).click();
  await expect(page.getByRole('dialog')).toContainText('Đồng hồ vẫn tiếp tục chạy.');
  await page.getByRole('button', {name: 'Tiếp tục làm bài'}).click();
  await page.getByRole('button', {name: 'Câu sau →'}).click();
  await request.post(fixture + '/__test__/failure', {data: {fail: true}});
  try {
    await page.locator('.answer').nth(2).click();
    await expect(page.locator('main').getByRole('alert')).toContainText('Không thể lưu dữ liệu');
    await expect(page.getByRole('status')).toHaveText('Có đáp án chưa lưu');
    await page.getByRole('button', {name: 'Nộp bài', exact: true}).click();
    await expect(page.getByRole('button', {name: 'Xác nhận nộp bài'})).toBeDisabled();
    await page.getByRole('button', {name: 'Tiếp tục làm bài'}).click();
  } finally {await request.post(fixture + '/__test__/failure', {data: {fail: false}});}
  await page.getByRole('button', {name: 'Lưu lại đáp án'}).click(); await saved(page);
  await page.getByRole('button', {name: 'Nộp bài', exact: true}).click();
  await expect(page.getByRole('dialog')).toContainText('18 câu chưa trả lời');
  await page.getByRole('button', {name: 'Xác nhận nộp bài'}).click();
  await expect(page).toHaveURL(/\/result\//);
  const resultUrl = page.url();
  await expect(page.locator('.big-number')).toContainText('2');
  await checkWidths(page);
  await page.screenshot({path: 'test-results/screenshots/result-desktop.png', fullPage: true});
  await page.getByRole('button', {name: 'Xem lời giải'}).click();
  await checkWidths(page);
  await expect(page.getByRole('heading', {name: 'Transcript', exact: true})).toBeVisible();
  await page.getByLabel('Chỉ xem câu sai').check();
  await expect(page.locator('.study-card .page-heading')).toContainText('Câu 3');
  await page.getByRole('link', {name: 'Lịch sử', exact: true}).first().click();
  await page.locator('.history-row').first().click();
  await expect(page).toHaveURL(resultUrl);
});

test('expired attempt auto-submits saved answers and denies cross-account results', async ({page, request, browser}) => {
  await login(page); await startExam(page);
  const id = page.url().split('/').at(-1)!;
  await page.locator('.answer').nth(0).click(); await saved(page);
  await request.post(fixture + '/__test__/deadline', {data: {id}});
  await page.reload();
  await expect(page).toHaveURL(/\/result\//, {timeout: 20_000});
  await expect(page.locator('.big-number')).toContainText('1');
  const other = await browser.newContext(); const otherPage = await other.newPage();
  await login(otherPage, 'bob@example.test');
  await otherPage.goto('/result/' + id);
  await expect(otherPage.getByRole('heading', {name: 'Không tìm thấy nội dung'})).toBeVisible();
  await expect(otherPage.locator('.big-number')).toHaveCount(0);
  await other.close();
});

test('responsive layouts, modal keyboard focus and local audio', async ({page, request}) => {
  await login(page);
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({width, height: 900});
    for (const route of ['/dashboard', '/vocabulary', '/exams', '/history']) {
      await page.goto(route);
      await expect(page.locator('.workspace')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (route === '/dashboard' && (width === 390 || width === 1440)) await page.screenshot({path: 'test-results/screenshots/dashboard-' + width + '.png', fullPage: true});
    }
  }
  await page.setViewportSize({width: 390, height: 844});
  await startExam(page);
  await page.route('**/audio/group-01.wav', route => route.abort());
  await page.locator('audio').evaluate(audio => (audio as HTMLAudioElement).play().catch(() => {}));
  await expect(page.getByRole('alert').filter({hasText: 'Không tải được audio'})).toBeVisible();
  await page.unroute('**/audio/group-01.wav');
  await page.getByRole('button', {name: 'Thử lại audio'}).click();
  await expect(page.locator('audio')).toBeVisible();
  await page.getByRole('button', {name: 'Danh sách câu hỏi', exact: true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => Boolean(document.querySelector('dialog')?.contains(document.activeElement)))).toBe(true);
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', {name: 'Danh sách câu hỏi', exact: true}).click();
  await page.getByRole('button', {name: 'Câu 20, chưa trả lời', exact: true}).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path: 'test-results/screenshots/exam-mobile.png', fullPage: true});
  const audio = await request.get('/audio/group-01.wav');
  expect(audio.status()).toBe(200); expect((await audio.body()).length).toBeGreaterThan(1000);
});

test('signup validation, long names, recovery and login redirect validation', async ({page}) => {
  const name = 'Người học có họ và tên rất dài để kiểm tra bố cục trên màn hình nhỏ';
  await page.goto('/auth/signup');
  await checkWidths(page);
  await page.getByLabel('Họ và tên').fill(name);
  await page.getByLabel('Email', {exact: true}).fill('new-learner@example.test');
  await page.getByLabel('Mật khẩu', {exact: true}).fill('Test-password-123');
  await page.getByLabel('Xác nhận mật khẩu').fill('Wrong-confirmation');
  await page.getByRole('button', {name: 'Tạo tài khoản'}).click();
  await expect(page.locator('main').getByRole('alert')).toContainText('chưa khớp');
  await page.getByLabel('Xác nhận mật khẩu').fill('Test-password-123');
  await page.getByRole('button', {name: 'Tạo tài khoản'}).click();
  await expect(page).toHaveURL(/\/auth\/verify\?kind=signup/);
  await login(page, 'new-learner@example.test');
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({width, height: 900});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole('button', {name: 'Đăng xuất'}).click();
  await page.goto('/auth/forgot');
  await checkWidths(page);
  await page.getByLabel('Email', {exact: true}).fill('alice@example.test');
  await page.getByRole('button', {name: 'Gửi liên kết'}).click();
  await expect(page).toHaveURL(/kind=recovery/);
  await page.goto('/auth/callback?token_hash=recovery-alice&type=recovery');
  await expect(page).toHaveURL(/\/auth\/reset$/);
  await checkWidths(page);
  await page.getByLabel('Mật khẩu', {exact: true}).fill('Test-password-123');
  await page.getByLabel('Xác nhận mật khẩu').fill('Test-password-123');
  await page.getByRole('button', {name: 'Lưu mật khẩu'}).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole('button', {name: 'Đăng xuất'}).click();
  await page.goto('/auth/login?next=https%3A%2F%2Fexample.org');
  await page.getByLabel('Email', {exact: true}).fill('alice@example.test');
  await page.getByLabel('Mật khẩu', {exact: true}).fill('Test-password-123');
  await page.getByRole('button', {name: 'Đăng nhập', exact: true}).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
