import pkg from "../../package.json";

const retVals: {
    [key: string]: Record<string, unknown> | boolean
} = {
    valid: {
        packageJson: {
            name: pkg.name,
            version: pkg.version,
            testProp: true,
            dependencies: {
                depProp: true,
            },
            devDependencies: {
                depProp2: true,
            },
            peerDependencies: {
                depProp3: true,
            },
        },
        path: "/test/package.json",
    },
    invalid: false,
};

let retType = "valid";

function getMockValue(): Record<string, unknown> | boolean {
    return retVals[retType];
}

jest.mock("read-pkg-up", () => ({
    sync: jest.fn(() => (getMockValue())),
}));

jest.mock("fs", () => ({
    realpathSync: jest.fn(() => process.cwd()),
    existsSync: jest.fn((path) => {
        if (path === "/test/file-exists.txt") {
            return true;
        } else {
            return false;
        }
    }),
}));


test("Validate module name", (done) => {
    import("../../src/lib/package").then((_package) => {
        expect(_package.getModuleName()).toEqual(pkg.name);
        done();
    });
});


test("Validate module version", (done) => {
    import("../../src/lib/package").then((_package) => {
        expect(_package.getModuleVersion()).toEqual(pkg.version);
    }).finally(() => {
        done();
    });
});

test("Validate module version is undefined when we mock read-pg-up module",
    (done) => {
        retType = "invalid";
        import("../../src/lib/package").then((_package) => {
            _package.clearCache();
            console.log(_package.getModuleName());
            expect(_package.getModuleName()).toBeUndefined();
            expect(_package.getModuleVersion()).toBeUndefined();
        }).finally(() => {
            done();
            jest.unmock("read-pkg-up");
        });
    });