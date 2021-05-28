const PENDING = 'pending';
const RESOLVED = 'resolved';
const REJECTED = 'rejected';

class Promise {
  constructor(executor) {
    this.status = PENDING;
    this.value = null;
    this.reason = null;
    this.resolveCallbacks = [];
    this.rejectCallbacks = [];
    try {
      //执行构造函数
      executor(this.resolve.bind(this), this.reject.bind(this));
    } catch (error) {
      this.reject(error);
    }
  }

  resolve(value) {
    if (this.status === PENDING) {
      //状态改变
      this.value = value;
      this.status = RESOLVED;
      //执行回调
      this.resolveCallbacks.forEach((onFulfilled) => {
        onFulfilled();
      });
    }
  }

  reject(reason) {
    if (this.status === PENDING) {
      //状态改变
      this.reason = reason;
      this.status = REJECTED;
      //执行回调
      this.rejectCallbacks.forEach((onRejected) => {
        onRejected();
      });
    }
  }

  then(onFulfilled, onRejected) {
    //相关函数校验,为了解决then()不传参数的时候，应该是将值透传
    onFulfilled =
      typeof onFulfilled === 'function' ? onFulfilled : (data) => data;
    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : (err) => {
            throw err;
          };
    //要可以链式调用，需要返回promise
    let promise2 = new Promise((resolve, reject) => {
      //pending状态下存储函数
      if (this.status === PENDING) {
        this.resolveCallbacks.push(() => {
          //为什么要setTimeout,是因为promise2还没执行完，同步拿不到propmise2实例去做对比
          setTimeout(() => {
            try {
              //then函数执行完的值
              let x = onFulfilled(this.value);
              resolvePromise(x, promise2, resolve, reject);
            } catch (error) {
              reject(error);
            }
          });
        });
        this.rejectCallbacks.push(() => {
          setTimeout(() => {
            try {
              //then函数执行完的值
              let x = onRejected(this.reason);
              resolvePromise(x, promise2, resolve, reject);
            } catch (error) {
              reject(error);
            }
          });
        });
      }
      //执行成功状态
      if (this.status === RESOLVED) {
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value);
            resolvePromise(x, promise2, resolve, reject);
          } catch (error) {
            reject(error);
          }
        });
      }
      //执行失败状态
      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason);
            resolvePromise(x, promise2, resolve, reject);
          } catch (error) {
            reject(error);
          }
        });
      }
    });
    return promise2;
  }
}

function resolvePromise(x, promise2, resolve, reject) {
  //如果执行的then里面，返回了promise本身，就是死循环，return掉
  if (x === promise2) {
    return reject(new TypeError('Chaining cycle detected for promise!'));
  }
  //如果then里返回的还是promise实例，继续执行propmise函数
  if (x && (typeof x === 'object' || typeof x === 'function')) {
    let called;
    try {
      let then = x.then;
      if (typeof then === 'function') {
        //执行then函数
        then.call(
          x,
          (value) => {
            if (called) return;
            called = true;
            resolvePromise(value, promise2, resolve, reject);
          },
          (reason) => {
            if (called) return;
            called = true;
            reject(reason);
          }
        );
      } else {
        resolve(x);
      }
    } catch (error) {
      if (called) return;
      called = true;
      reject(error);
    }
  } else {
    //如果返回的是普通值，直接resolve
    resolve(x);
  }
}

Promise.deferred = function () {
  let deferred = {};
  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred;
};

/*
  Promise.resolve()
  Promise.reject()
  Promise.all([])
  Promise.race()
  Promise.allSettled([])
  ...
*/

module.exports = Promise;
