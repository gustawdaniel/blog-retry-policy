import {retryPolicy} from "./policy";

class Rectangle {
    a: number
    b: number

    constructor(a: number, b: number) {
        this.a = a;
        this.b = b;
    }

    async field(n: number, m: number) {
        if (Math.random() > n) {
            return this.a * this.b
        } else {
            if(Math.random() > m) {
                throw new Error(`Random Fail`);
            } else {
                throw new Error(`CRITICAL`);
            }
        }
    }
}


async function main() {
    const rec = retryPolicy<Rectangle>(new Rectangle(1, 2), {retries: 3, delay: 0});
    // const rec = new Rectangle(1, 2);
    const res = {
        ok: 0,
        fail: 0
    }

    for (let i = 0; i < 1000; i++) {
        try {
            await rec.field(0.1, 0.1);
            res.ok++;
        } catch {
            res.fail++;
        }
    }

    console.log(res);
}

main().catch(console.error)