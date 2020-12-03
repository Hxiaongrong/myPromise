class _Promise{
  constructor(fn) {
    this.status         = 'pending'
    this.value          = null
    this.reason         = null
    this.onFulfilledArr = []
    this.onRejectedArr  = []
    this.resolve        = this.resolve.bind(this)
    this.reject         = this.reject.bind(this)
    this.then           = this.then.bind(this)
    try{
      fn(this.resolve, this.reject)
    } catch(err) {
      this.reject(err)
    } 
  }
  resolve(value) {
    if(value === this) {
      this.reject(new TypeError("A promise cannot be onFulfilled with itself."))
    }
    let type = Object.prototype.toString.call(value)
    if(
      value && 
      (type === '[object Object]' || type === '[object Function]')
    ){
      let flag = false
      try {
        const then = value.then
        if(typeof then === 'function') {
          then.call(
            value,
            value => {
              if(flag) return
              flag = true
              this.resolve(value)
            },
            value => {
              if(flag) return
              flag = true
              this.reject(value)
            }
          )
          return
        }
      } catch(e) {
        if(flag) return
        flag = true
        this.reject(e)
      }
    }
    if(
      value &&
      value instanceof _Promise &&
      value.then === this.then
    ) {
      if(this.status === 'pending') {
        value.onFulfilledArr = this.onFulfilledArr
        value.onRejectedArr = this.onRejectedArr
      }
      if (value.status === "onFulfilled") {
        this.value = value.value
        this.onFulfilledArr.forEach((fn) => fn(value.value))
      }
      if (value.status === "onRejected") {
        this.reason = value.reason
        this.onRejectedArr.forEach((fn) => fn(value.reason))
      }
      return
    }
    if (this.status === "pending") {
      this.status = "onFulfilled"
      this.value = value
      this.onFulfilledArr.forEach((fn) => fn(value))
    }
  }
  reject(err) {
    if(this.status === 'pending') {
      this.status = 'onRejected'
      this.reason = err
      this.onRejectedArr.forEach(f => f(err))
    }
  }
  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === "function" ? onFulfilled : (val) => val
    onRejected  = typeof onRejected === "function" ? onRejected : (err) => { throw err }
    const newPromise = new _Promise((resolve, reject) => {
      if (this.status === "onFulfilled") {
        setTimeout(() => {
          try{
            let value = this.value
            value = onFulfilled(value)
            resolve(value)
          } catch(e) {
            reject(e)
          }
        });
      }
      if(this.status === "onRejected") {
        setTimeout(() => {
          try {
            let reason = this.reason
            reason = onRejected(this.reason);
            resolve(reason)
          } catch (e) {
            reject(e)
          }
        })
      }
      if (this.status === "pending") {
        this.onFulfilledArr.push((data) => {
          setTimeout(() => {
            try {
              let value = data
              value = onFulfilled(value)
              resolve(value)
            } catch (e) {
              reject(e)
            }
          })
        })
        this.onRejectedArr.push((data) => {
          setTimeout(() => {
            try {
              let reason = onRejected(data)
              resolve(reason)
            } catch (e) {
              reject(e)
            }
          })
        })
      }
    })
    return newPromise
  }
  catch(onRejected) {
    const newPromise = new _Promise((resolve, reject) => {
      if(this.status === "onRejected") {
        try{
          setTimeout(() => {
            let value = this.reason
            if(typeof onRejected === 'function') {
              value = onRejected(value)
            }
            resolve(value)
          })
        } catch(e) {
          rejected(e)
        }
      }
      if(this.status === "pending") {
        this.onRejectedArr.push(data => {
          setTimeout(() => {
            try {
              let value
              if(typeof onRejected === "function") {
                value = onRejected(data)
              }
              resolve(value)
            } catch (e) {
              reject(e)
            }
          });
        })
      }
    })
    return newPromise
  }
}
_Promise.defer = _Promise.deferred = () => {
  let obj = {}
  obj.promise = new _Promise((resolve, reject) => {
    obj.resolve = resolve
    obj.reject = reject
  })
  return obj
}
_Promise.all = data => {
  let count = 0
  let total = data.length
  let result = []
  return new _Promise((resolve, reject) => {
    for(let i = 0; i < total; i++) {
      data[i].then(res => {
        result.push(res)
        count++
        if(total === count) {
          resolve(result)
        }
      }, res => {
        return this.reject(res)
      })
    }
  })
}
_Promise.race = data => {
  const total = data.length
  return new _Promise((resolve, reject) => {
    for(let i = 0; i < total; i++) {
      data[i].then(
        res => resolve(res),
        res => reject(res)
      )
    }
  })
}
_Promise.allSettled = data => {

}
_Promise.resolve = data => {
  return new _Promise(res => res(data))
}
_Promise.reject = err => {
  return new _Promise((res, rej) => rej(err))
}
module.exports = _Promise