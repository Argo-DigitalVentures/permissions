//////////////////////////////
// begin imports /////////////
//////////////////////////////
import chalk from 'chalk';
import { appSymbols, BaseFactory, helper, util } from '../../lib';
import { BaseRoles, BaseTypes, LeastStrict, MostStrict } from '../../test_helpers';

//////////////////////////////
// begin setup ///////////////
//////////////////////////////
const { _inherit, _permittedKeys, _restrictedOwnKeysAdd, _restrictedOwnTypesAdd } = appSymbols;
const { CreateDomain } = helper;
const { symbolize } = util;

const demoGroups = ['super_user', 'leastStrict', 'mostStrict'];
const allRoles = CreateDomain(BaseRoles());
const allTypes = CreateDomain(BaseTypes());
const restricted = () => ({
  super_user: {
    roles: [],
    types: [],
  },
  leastStrict: {
    roles: allRoles().getRestrictedTypes(LeastStrict().roles),
    types: allTypes().getRestrictedTypes(LeastStrict().types),
  },
  mostStrict: {
    roles: allRoles().getRestrictedTypes(MostStrict().roles),
    types: allTypes().getRestrictedTypes(MostStrict().types),
  },
});
const restrictedData = () => ({
  super_user: {
    roles: BaseRoles(),
    types: BaseTypes(),
  },
  leastStrict: LeastStrict(),
  mostStrict: MostStrict(),
});

//////////////////////////////
// begin tests ///////////////
//////////////////////////////
describe(`${chalk.yellow.bold.underline('Methods')}: applying"${chalk.blue.bold('keys')}" and "${chalk.blue.bold(
  'types',
)}" restrictions`, () => {
  let Groups;
  let Roles;
  let Types;
  beforeEach(() => {
    Roles = allRoles().createRules('roles');
    Types = allTypes().createRules('types');
    Groups = BaseFactory('demo', {}, { [symbolize('roles')]: Roles, [symbolize('types')]: Types });
    demoGroups.forEach(demoGroup => {
      const otherDemoGroups = demoGroups.filter(item => item !== demoGroup);
      if (demoGroup === 'super_user') {
        Groups[_inherit](demoGroup, {
          restrictedTypes: otherDemoGroups,
        });
      } else {
        const { roles = [], types = [] } = restricted()[demoGroup];
        Groups[_inherit](demoGroup, {
          restrictedTypes: [{ [symbolize('roles')]: roles }, { [symbolize('types')]: types }, ...otherDemoGroups],
        });
      }
    });
  });
  afterEach(() => {
    Groups = undefined;
    Roles = undefined;
    Types = undefined;
  });
  demoGroups.forEach(demoGroup => {
    describe(`${chalk.blue.bold(demoGroup)}`, () => {
      const demoGroupRestrictedData = restrictedData()[demoGroup] || {};
      allRoles()
        .getUniqueTypes()
        .forEach(key => {
          const domaineType = 'roles';
          const demoGroupRestrictedRoles = demoGroupRestrictedData[domaineType] || {};
          const demoGroupRoleRestrictedKeys = demoGroupRestrictedRoles[key] || [];
          if (demoGroupRoleRestrictedKeys.length) {
            const modifiedBaseRoleKeys = allRoles()
              .getUniqueKeys(key)
              .filter(item => !demoGroupRoleRestrictedKeys.includes(item))
              .sort();
            describe(`restricting keys [${chalk.blue.italic(demoGroupRoleRestrictedKeys)}] to ${chalk.blue.bold(
              demoGroup,
            )} "${chalk.yellow.bold(key)}" definitions`, () => {
              it(`restricts [${chalk.blue.italic(demoGroupRoleRestrictedKeys)}] from ${chalk.blue.bold(demoGroup)} "${chalk.yellow.bold(
                key,
              )}" definitions`, () => {
                const demoGroupRole = Groups[symbolize(demoGroup)][symbolize(domaineType)][symbolize(key)];
                const preDemoGroupRoleKeys = demoGroupRole[_permittedKeys]().sort();
                // ///////////////////////////////
                // adding restrictedKeys here
                demoGroupRole[_restrictedOwnKeysAdd](demoGroupRoleRestrictedKeys);
                // ///////////////////////////////
                const postdemoGroupRoleKeys = demoGroupRole[_permittedKeys]().sort();
                const demoGroupRoleKeys = demoGroupRole[_permittedKeys]().sort();

                expect(postdemoGroupRoleKeys).toEqual(modifiedBaseRoleKeys);
                expect(demoGroupRoleKeys).toEqual(expect.not.arrayContaining(demoGroupRoleRestrictedKeys));
                expect(preDemoGroupRoleKeys).not.toEqual(postdemoGroupRoleKeys);
              });
              demoGroups.filter(item => item !== demoGroup).forEach(otherDemoGroup => {
                const otherDemoGroupRoles = restrictedData()[otherDemoGroup][domaineType];
                const otherDemoGroupRoleRestrictedKeys = otherDemoGroupRoles[key] || [];
                const otherDemoGroupPermittedRoles = Object.keys(otherDemoGroupRoles);
                if (
                  otherDemoGroupRoleRestrictedKeys.length &&
                  otherDemoGroupPermittedRoles.length &&
                  otherDemoGroupPermittedRoles.includes(key)
                ) {
                  describe(`restricting keys [${chalk.blue.italic(demoGroupRoleRestrictedKeys)}] to ${chalk.blue.bold(
                    demoGroup,
                  )} "${chalk.yellow.bold(key)}" definitions has ${chalk.red.bold.underline('NO')} side-effects`, () => {
                    it(`${chalk.blue.bold(otherDemoGroup)} "${chalk.green.bold(key)}" definitions ${chalk.yellow.bold(
                      'STILL',
                    )} contains [${chalk.blue.italic(demoGroupRoleRestrictedKeys)}]`, () => {
                      const demoGroupRole = Groups[symbolize(demoGroup)][symbolize(domaineType)][symbolize(key)];
                      const otherDemoGroupRole = Groups[symbolize(otherDemoGroup)][symbolize(domaineType)][symbolize(key)];
                      const predemoGroupRoleKeys = demoGroupRole[_permittedKeys]().sort();
                      const preOtherDemoGroupRoleKeys = otherDemoGroupRole[_permittedKeys]().sort();
                      // ///////////////////////////////
                      // adding restrictedKeys here
                      demoGroupRole[_restrictedOwnKeysAdd](demoGroupRoleRestrictedKeys);
                      // ///////////////////////////////
                      const postdemoGroupRoleKeys = demoGroupRole[_permittedKeys]().sort();
                      const postOtherDemoGroupRoleKeys = otherDemoGroupRole[_permittedKeys]().sort();

                      expect(preOtherDemoGroupRoleKeys).toEqual(postOtherDemoGroupRoleKeys);
                      expect(predemoGroupRoleKeys).not.toEqual(postdemoGroupRoleKeys);
                      expect(postdemoGroupRoleKeys).toEqual(modifiedBaseRoleKeys);
                      expect(postOtherDemoGroupRoleKeys).toEqual(expect.arrayContaining(demoGroupRoleRestrictedKeys));
                    });
                  });
                }
              });
            });
            describe(`restricting type "${chalk.yellow.bold(key)}" to ${chalk.blue.bold(demoGroup)}`, () => {
              it(`removes "${chalk.yellow.bold(key)}" from ${chalk.blue.bold(demoGroup)}`, () => {
                const demoGroupRoles = Groups[symbolize(demoGroup)][symbolize(domaineType)];
                const predemoGroupRole = demoGroupRoles[symbolize(key)];
                // ///////////////////////////////
                // adding restrictedTypes here
                demoGroupRoles[_restrictedOwnTypesAdd]([key]);
                // ///////////////////////////////
                const postdemoGroupRole = demoGroupRoles[symbolize(key)];
                expect(predemoGroupRole).toBeDefined();
                expect(postdemoGroupRole).toBeUndefined();
              });
            });
            demoGroups.filter(item => item !== demoGroup).forEach(otherDemoGroup => {
              const otherDemoGroupRoles = restrictedData()[otherDemoGroup][domaineType];
              const otherDemoGroupRoleRestrictedKeys = otherDemoGroupRoles[key] || [];
              const otherDemoGroupPermittedRoles = Object.keys(otherDemoGroupRoles);
              if (
                otherDemoGroupRoleRestrictedKeys.length &&
                otherDemoGroupPermittedRoles.length &&
                otherDemoGroupPermittedRoles.includes(key)
              ) {
                describe(`restricting type "${chalk.green.bold(key)}" to ${chalk.blue.bold(demoGroup)} has ${chalk.red.bold.underline(
                  'NO',
                )} side-effects`, () => {
                  it(`${chalk.blue.bold(otherDemoGroup)} "${chalk.green.bold(key)}" is ${chalk.yellow.bold.underline(
                    'STILL',
                  )} defined`, () => {
                    const demoGroupRoles = Groups[symbolize(demoGroup)][symbolize(domaineType)];
                    const otherDemoGroupRoles = Groups[symbolize(otherDemoGroup)][symbolize(domaineType)];
                    const predemoGroupRole = demoGroupRoles[symbolize(key)];
                    const preOtherDemoGroupRole = otherDemoGroupRoles[symbolize(key)];
                    // ///////////////////////////////
                    // adding restrictedTypes here
                    demoGroupRoles[_restrictedOwnTypesAdd]([key]);
                    // ///////////////////////////////
                    const postdemoGroupRole = demoGroupRoles[symbolize(key)];
                    const postOtherDemoGroupRole = otherDemoGroupRoles[symbolize(key)];
                    expect(predemoGroupRole).toBeDefined();
                    expect(postdemoGroupRole).toBeUndefined();
                    expect(preOtherDemoGroupRole).toBeDefined();
                    expect(postOtherDemoGroupRole).toBeDefined();
                    expect(preOtherDemoGroupRole).toEqual(postOtherDemoGroupRole);
                  });
                });
              }
            });
          }
        });
      allTypes()
        .getUniqueTypes()
        .forEach(key => {
          const domainType = 'types';
          const demoGroupRestrictedTypes = demoGroupRestrictedData[domainType] || {};
          const demoGroupTypeRestrictedKeys = demoGroupRestrictedTypes[key] || [];
          if (demoGroupTypeRestrictedKeys.length) {
            const modifiedBaseTypeKeys = allTypes()
              .getUniqueKeys(key)
              .filter(item => !demoGroupTypeRestrictedKeys.includes(item))
              .sort();

            describe(`restricting keys [${chalk.blue.italic(demoGroupTypeRestrictedKeys)}] to ${chalk.blue.bold(
              demoGroup,
            )} "${chalk.yellow.bold(key)}" definitions`, () => {
              it(`restricts [${chalk.blue.italic(demoGroupTypeRestrictedKeys)}] from ${chalk.blue.bold(demoGroup)} "${chalk.yellow.bold(
                key,
              )}" definitions`, () => {
                const demoGroupType = Groups[symbolize(demoGroup)][symbolize(domainType)][symbolize(key)];
                const predemoGroupTypeKeys = demoGroupType[_permittedKeys]().sort();
                // ///////////////////////////////
                // adding restrictedKeys here
                demoGroupType[_restrictedOwnKeysAdd](demoGroupTypeRestrictedKeys);
                // ///////////////////////////////
                const postdemoGroupTypeKeys = demoGroupType[_permittedKeys]().sort();
                const demoGroupTypeKeys = demoGroupType[_permittedKeys]().sort();

                expect(postdemoGroupTypeKeys).toEqual(modifiedBaseTypeKeys);
                expect(demoGroupTypeKeys).toEqual(expect.not.arrayContaining(demoGroupTypeRestrictedKeys));
                expect(predemoGroupTypeKeys).not.toEqual(postdemoGroupTypeKeys);
              });
              demoGroups.filter(item => item !== demoGroup).forEach(otherDemoGroup => {
                const otherDemoGroupTypes = restrictedData()[otherDemoGroup][domainType];
                const otherDemoGroupTypeRestrictedKeys = otherDemoGroupTypes[key] || [];
                const otherDemoGroupPermittedTypes = Object.keys(otherDemoGroupTypes);
                if (
                  otherDemoGroupTypeRestrictedKeys.length &&
                  otherDemoGroupPermittedTypes.length &&
                  otherDemoGroupPermittedTypes.includes(key)
                ) {
                  describe(`restricting keys [${chalk.blue.italic(demoGroupTypeRestrictedKeys)}] to ${chalk.blue.bold(
                    demoGroup,
                  )} "${chalk.yellow.bold(key)}" definitions has ${chalk.red.bold.underline('NO')} side-effects`, () => {
                    it(`${chalk.blue.bold(otherDemoGroup)} "${chalk.green.bold(key)}" definitions ${chalk.yellow.bold(
                      'STILL',
                    )} contains [${chalk.blue.italic(demoGroupTypeRestrictedKeys)}]`, () => {
                      const demoGroupType = Groups[symbolize(demoGroup)][symbolize(domainType)][symbolize(key)];
                      const otherDemoGroupType = Groups[symbolize(otherDemoGroup)][symbolize(domainType)][symbolize(key)];
                      const predemoGroupTypeKeys = demoGroupType[_permittedKeys]().sort();
                      const preOtherDemoGroupTypeKeys = otherDemoGroupType[_permittedKeys]().sort();
                      // ///////////////////////////////
                      // adding restrictedKeys here
                      demoGroupType[_restrictedOwnKeysAdd](demoGroupTypeRestrictedKeys);
                      // ///////////////////////////////
                      const postdemoGroupTypeKeys = demoGroupType[_permittedKeys]().sort();
                      const postOtherDemoGroupTypeKeys = otherDemoGroupType[_permittedKeys]().sort();

                      expect(preOtherDemoGroupTypeKeys).toEqual(postOtherDemoGroupTypeKeys);
                      expect(predemoGroupTypeKeys).not.toEqual(postdemoGroupTypeKeys);
                      expect(postdemoGroupTypeKeys).toEqual(modifiedBaseTypeKeys);
                      expect(postOtherDemoGroupTypeKeys).toEqual(expect.arrayContaining(demoGroupTypeRestrictedKeys));
                    });
                  });
                }
              });
            });
            describe(`restricting type "${chalk.yellow.bold(key)}" to ${chalk.blue.bold(demoGroup)}`, () => {
              it(`removes "${chalk.yellow.bold(key)}" from ${chalk.blue.bold(demoGroup)}`, () => {
                const demoGroupTypes = Groups[symbolize(demoGroup)][symbolize(domainType)];
                const predemoGroupType = demoGroupTypes[symbolize(key)];
                // ///////////////////////////////
                // adding restrictedTypes here
                demoGroupTypes[_restrictedOwnTypesAdd]([key]);
                // ///////////////////////////////
                const postdemoGroupType = demoGroupTypes[symbolize(key)];
                expect(predemoGroupType).toBeDefined();
                expect(postdemoGroupType).toBeUndefined();
              });
            });
            demoGroups.filter(item => item !== demoGroup).forEach(otherDemoGroup => {
              const otherDemoGroupTypes = restrictedData()[otherDemoGroup][domainType];
              const otherDemoGroupTypeRestrictedKeys = otherDemoGroupTypes[key] || [];
              const otherDemoGroupPermittedTypes = Object.keys(otherDemoGroupTypes);
              if (
                otherDemoGroupTypeRestrictedKeys.length &&
                otherDemoGroupPermittedTypes.length &&
                otherDemoGroupPermittedTypes.includes(key)
              ) {
                describe(`restricting type "${chalk.green.bold(key)}" to ${chalk.blue.bold(demoGroup)} has ${chalk.red.bold.underline(
                  'NO',
                )} side-effects`, () => {
                  it(`${chalk.blue.bold(otherDemoGroup)} "${chalk.green.bold(key)}" is ${chalk.yellow.bold.underline(
                    'STILL',
                  )} defined`, () => {
                    const demoGroupTypes = Groups[symbolize(demoGroup)][symbolize(domainType)];
                    const otherDemoGroupTypes = Groups[symbolize(otherDemoGroup)][symbolize(domainType)];
                    const predemoGroupType = demoGroupTypes[symbolize(key)];
                    const preOtherDemoGroupType = otherDemoGroupTypes[symbolize(key)];
                    // ///////////////////////////////
                    // adding restrictedTypes here
                    demoGroupTypes[_restrictedOwnTypesAdd]([key]);
                    // ///////////////////////////////
                    const postdemoGroupType = demoGroupTypes[symbolize(key)];
                    const postOtherDemoGroupType = otherDemoGroupTypes[symbolize(key)];
                    expect(predemoGroupType).toBeDefined();
                    expect(postdemoGroupType).toBeUndefined();
                    expect(preOtherDemoGroupType).toBeDefined();
                    expect(postOtherDemoGroupType).toBeDefined();
                    expect(preOtherDemoGroupType).toEqual(postOtherDemoGroupType);
                  });
                });
              }
            });
          }
        });
    });
  });
});
