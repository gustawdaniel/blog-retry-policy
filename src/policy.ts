import debug from 'debug';
import {RetryOptions} from "ts-retry";
import {NotRetryableError, RetryConfig, retryDecorator} from "ts-retry-promise";
import {types} from 'util';

export function tryNTimes(fun: any, target: any, policy: RetryOptions) {
    const maxTry = policy.maxTry || 1;
    return (args: any) => {
        return new Promise((resolve, reject) => {
            fun.bind(target)(args).then(resolve).catch((err: any) => {
                if (maxTry > 0) {
                    const timeout = 1e3 * Math.pow(2, 3 - maxTry);
                    debug('app')(`waiting ${timeout}...`);
                    const tHandler = setTimeout(() => {
                        debug('app')("retrying...");
                        resolve(tryNTimes(fun, target, {
                            maxTry: maxTry - 1,
                            delay: (policy.delay || 0) - timeout
                        })(args - 1))
                    }, timeout)

                    if ((policy.delay || 0) < 0) {
                        clearTimeout(tHandler);
                        reject(new Error(`Timeout elapsed.`))
                    }

                } else {
                    reject(err)
                }
            })
        })
    }
}

function rethrowNotRetryableErrors(fun: any):any {
    return (...args:any) => {
        return fun(...args).catch((err: unknown) => {
            if(types.isNativeError(err)) {
                if(err.message.includes('CRITICAL')) throw new NotRetryableError(err.message);
            }
            throw err;
        })
    }
}

export function retryPolicy<T>(obj: any, policy: Partial<RetryConfig<any>>): T {
    return new Proxy(obj, {
        get(target, handler) {
            if (handler in target) {
                if (handler === 'field') {
                    return retryDecorator(rethrowNotRetryableErrors(target[handler].bind(target)), policy)
                }
                return target[handler];
            }
        }
    })
}

