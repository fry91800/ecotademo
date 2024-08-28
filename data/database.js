const { Sequelize } = require('sequelize');
const sql = require('sql');
const sequelize = new Sequelize('ecota', 'francois', 'USp4pGLXY2xOGUiIiu8IcPCsURAzquTD', {
  host: 'dpg-cr7itlrv2p9s73a52ihg-a',
  dialect: 'postgres',  // Change this according to your database
  logging: process.env.SEQUELIZE_LOGGING === 'true' ? console.log : false
});
const { logger, logEnter, logExit } = require('../config/logger');


const { DataTypes } = require('sequelize');
//const sequelize = require('../database');

const Orga = sequelize.define('Orga', {
  // Define attributes
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  mail: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pass: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  team: {
    type: DataTypes.STRING,
    references: {
        model: 'team',
        key: 'code',
    }
  },
  resettoken: {
    type: DataTypes.UUID,
  },
  resetdeadline: {
    type: DataTypes.DATE
}
}, {
  tableName: 'orga',  // Specify the table name if it's different from the model name
  timestamps: false,   // Disable timestamps if your table doesn't have `createdAt` and `updatedAt`
});

const Session = sequelize.define('session',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

        orgaid: {
            type: Sequelize.INTEGER,
            references: {
               model: 'orga',
               key: 'id',
            }
        },
        starttime: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        endtime: {
            type: DataTypes.DATE
        }
    },

    {
        freezeTableName: true
    }
);

const Country = sequelize.define('country',
  {
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    desc: {
      type: DataTypes.STRING,
    },
  },

  {
      freezeTableName: true
  }
);

const Team = sequelize.define('team',
  {
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    desc: {
      type: DataTypes.STRING,
    },
  },

  {
      freezeTableName: true
  }
);

const Intensity = sequelize.define('intensity',
  {
    desc: {
      type: DataTypes.STRING,
    },
  },

  {
      freezeTableName: true
  }
);

const Supplier1 = sequelize.define('supplier1',
  {
    erp: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    mdm: {
      type: DataTypes.STRING,
    },
    name: {
      type: DataTypes.STRING,
    },
    revenue: {
      type: Sequelize.INTEGER
    },
    team: {
        type: DataTypes.STRING,
        references: {
            model: 'team',
            key: 'code',
        }
      }
  },

  {
      freezeTableName: true
  }
);

const Supplier2 = sequelize.define('supplier2',
  {
    erp: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    mdm: {
      type: DataTypes.STRING,
    },
    country: {
        type: DataTypes.STRING,
        references: {
            model: 'country',
            key: 'code',
        }
      }
  },

  {
      freezeTableName: true
  }
);

const Campaign = sequelize.define('campaign',
  {
    year: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    revenue: {
      type: Sequelize.INTEGER,
    },
    intensity: {
        type: Sequelize.INTEGER,
        references: {
            model: 'intensity',
            key: 'id',
        }
      }
  },

  {
      freezeTableName: true
  }
);

const SupplierSelection = sequelize.define('supplierselection',
  {
    year: {
      type: Sequelize.INTEGER,
      references: {
          model: 'campaign',
          key: 'year',
      }
    },
    erp: {
      type: DataTypes.STRING,
      references: {
          model: 'supplier1',
          key: 'erp',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    name: {
        type: DataTypes.STRING,
      },
    reason1:
    { 
      type: DataTypes.BOOLEAN,
      defaultValue: false 
    },
    reason2:
    { 
      type: DataTypes.BOOLEAN,
      defaultValue: false 
    },
    reason3:
    { 
      type: DataTypes.BOOLEAN,
      defaultValue: false 
    },
    reason4:
    { 
      type: DataTypes.BOOLEAN,
      defaultValue: false 
    },
    reason5:
    { 
      type: DataTypes.BOOLEAN,
      defaultValue: false 
    },
    selected:
    { 
      type: DataTypes.BOOLEAN,
      defaultValue: false 
    },
    force:
    { 
      type: DataTypes.BOOLEAN,
      defaultValue: null
    },
    comment:
    { 
      type: Sequelize.TEXT
    },
    commenter:
    { 
      type: DataTypes.INTEGER,
      references: {
        model: 'orga',
        key: 'id',
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
    }
  },

  {
      freezeTableName: true
  }
);

const SupplierCotaData = sequelize.define('suppliercotadata',
  {
    year: {
      type: Sequelize.INTEGER,
      references: {
          model: 'campaign',
          key: 'year',
      }
    },
    erp: {
      type: DataTypes.STRING,
      references: {
          model: 'supplier1',
          key: 'erp',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    intensity: {
      type: Sequelize.INTEGER,
      references: {
          model: 'intensity',
          key: 'id',
      }
    }
  })

Orga.hasMany(Session, { foreignKey: 'orgaid' });
Session.belongsTo(Orga, { foreignKey: 'orgaid' });

sequelize.sync()
  .then(() => {
    logger.info('Database synchronized');
  })
  .catch(err => {
    console.error('Error synchronizing database:', err);
  });

module.exports = {
  sequelize,
  Orga,
  Session,
  Country,
  Team,
  Intensity,
  Supplier1,
  Supplier2,
  Campaign,
  SupplierSelection,
  SupplierCotaData
}