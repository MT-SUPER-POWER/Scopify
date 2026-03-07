
import { test } from 'bun:test';
import { sendCaptcha, verifyCaptcha } from '@/lib/web/auth';


test('发送验证码', async () => {
    const sendCaptchaResult = await sendCaptcha('13096290298');
    console.log('sendCaptchaResult:', sendCaptchaResult);
});

test('校验验证码', async () => {
    const verifyCaptchaResult = await verifyCaptcha('13096290298', '7768');
    console.log('verifyCaptchaResult:', verifyCaptchaResult);
});
