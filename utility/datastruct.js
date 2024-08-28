function dictionarize(array, keyField, fieldsToKeep = []) {
    return array.reduce((acc, obj) => {
      const key = obj[keyField];
      if (!key) {
        throw new Error(`Key field "${keyField}" not found in object.`);
      }
  
      if (fieldsToKeep.length > 0) {
        acc[key] = fieldsToKeep.reduce((fieldAcc, field) => {
          if (obj[field] !== undefined) {
            fieldAcc[field] = obj[field];
          }
          return fieldAcc;
        }, {});
      } else {
        acc[key] = { ...obj };
      }
      
      return acc;
    }, {});
  }

module.exports=
{
    dictionarize
}