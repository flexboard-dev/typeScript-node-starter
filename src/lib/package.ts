import path from "path";
import readPkgUp from "read-pkg-up";

/**
 * Object returned by loadPackageData.
 */
export interface PackageData {
    pkgJson?: readPkgUp.NormalizedPackageJson;
    pkgRoot?: string;
}


/**
   * Module-local cached result from read-pkg-up.
   */
const cachedPackageResult: PackageData = {};


/**
 * Loads the package.json of the host application, if one exists, and caches the
 * result.
 * @return {PackageData}
 */
export function getPackageInfo(): PackageData {
    if (Object.keys(cachedPackageResult).length === 0) {
        const packageResult = readPkgUp.sync();
        if (packageResult) {
            cachedPackageResult.pkgJson = packageResult.packageJson;
            cachedPackageResult.pkgRoot = path.dirname(packageResult.path);
        }
    }
    return cachedPackageResult;
}

/**
 * Get current module version
 * @return {string}
 */
export function getModuleVersion(): string {
    return getPackageInfo().pkgJson.version;
}

/**
 * Get current module name
 * @return {string}
 */
export function getModuleName(): string {
    return getPackageInfo().pkgJson.name;
}
/**
 * Clear cached package
 */
export function clearCache(): void {
    delete cachedPackageResult.pkgJson;
    delete cachedPackageResult.pkgRoot;
}