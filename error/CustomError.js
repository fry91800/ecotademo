class CustomError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  }

function testError()
{
    throw new CustomError("testError", 400);
}
function defaultError()
{
    throw new CustomError("defaultError", 400);
}

function missingFieldError()
{
    throw new CustomError("missingFieldError", 400);
}

function mailNoExistError()
{
    throw new CustomError("mailNoExistError", 400);
}
function wrongPassError()
{
    throw new CustomError("wrongPassError", 400);
}
function differentPassError()
{
    throw new CustomError("differentPassError", 400);
}
function tokenExpiredError()
{
    throw new CustomError("tokenExpiredError", 400);
}
function wrongParam()
{
    throw new CustomError("wrongParam", 400);
}

module.exports = {
    CustomError,
    testError,
    defaultError,
    missingFieldError,
    mailNoExistError,
    wrongPassError,
    tokenExpiredError,
    differentPassError,
    wrongParam
}