// https://www.youtube.com/watch?v=1l4wHWQCCIc&t=954s&ab_channel=WebDevSimplified
// https://github.com/WebDevSimplified/js-promise-library/
// https://medium.com/nerd-for-tech/implement-your-own-promises-in-javascript-68ddaa6a5409
const promiseStates = {
  REJECTED: "rejected",
  FULFILLED: "fullfilled",
  PENDING: "pending"
}

class MyPromise {

  constructor(callback) {
    this.thenHandlers = [];
    this.catchHandlers = [];
    this.state = promiseStates.PENDING;
    this.value;

    try {
      callback(this._resolve, this._reject);
    } catch (e) {
      this._reject(e);
    }
  }

  _resolve = value => {
    this.#updateState(value, promiseStates.FULFILLED);
  }

  _reject = value => {
    this.#updateState(value, promiseStates.REJECTED);
  }

  #updateState = (value, state) => {
    // actually put on event loop job queue
    // for testing, can just use setTimeout, 0
    queueMicrotask(()=>{
      
      if (this.state === promiseStates.PENDING) {
      // Prevents 'resolve' or 'reject' again (e.g. using resolve in a promise multiple times) or .then again on fulfilled/rejected promise

      if(value instanceof MyPromise) {
        value.then(this._resolve, this._reject);
        return;
      }
        
      this.state = state;
      this.value = value;
      this.#runHandlers();
    }
      
    });

  }

  #runHandlers = () => {
    
    if (this.state === promiseStates.PENDING) return;
    const handlers = this.state === promiseStates.FULFILLED ? this.thenHandlers : this.catchHandlers;
    for (const handler of handlers) {
      handler(this.value);
    }

    this.#clearHandlers();
  }

  #clearHandlers = () => {
    this.thenHandlers = [];
    this.catchHandlers = [];
  }

  then = (thenCB, catchCB) => {
    return new MyPromise( (resolve, reject) => {
      // Push callback for thenable - success
      this.thenHandlers.push(value => {
        // value will be the this.value from the parent Promise
        if(typeof(thenCB) !== 'function') {
          // no callback -- just resolve
          // if thenCb is a char, bool, number, null or undefined - just resolve it in the promise created by the thenable
          resolve(value);
          return;
        }

        // thenCB is a 'function' callback
        try {
          resolve(thenCB(value));
        } catch (e) {
          reject(e);
        }
        
      });

      // Push callback for thenable - success
      this.catchHandlers.push(value => {
        // value (error or value) will be the this.value from the parent Promise
        if(typeof(catchCB) !== 'function') {
          // no callback -- just resolve
          // if catchCB is a char, bool, number, null or undefined - just resolve it in the promise created by the thenable
          reject(value);
          return;
        }

        try {
          // this is really a reject in the parent Promise
          // see this._reject
          // allows for **promise recovery**
          resolve(catchCB(value)); 
        } catch (e) {
          reject(e);
        }
        
      });
      if(typeof(catchCB) === 'function') this.catchHandlers.push(catchCB);

      // run handlers before the next thennable pushes callbacks
      this.#runHandlers();
    });
  }
  
  catch = (cb) => {
    return this.then(null, cb);
  }

  finally = (cb) => {
    cb();
    // this continues either to the next thenable or next catch
    return this.then(value => value, value => {throw value;});
  }

}


module.exports = MyPromise;
