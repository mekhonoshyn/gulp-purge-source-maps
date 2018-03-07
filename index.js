import del from 'del';
import path from 'path';
import gulp from 'gulp';
import through2 from 'through2';
import {PluginError} from 'gulp-util';
import decomment from 'gulp-decomment';
import mergeStream from 'merge-stream';

export default purgeSourceMaps;

const PLUGIN_NAME = 'gulp-purge-source-maps';

function purgeSourceMaps({sourcesType, manifestPath, sourcesPath}) {
    return () => {
        del(path.join(sourcesPath, `*.${sourcesType}.map`));

        const sourcesStream = gulp
            .src(path.join(sourcesPath, `*.${sourcesType}`))
            .pipe(decomment.text({trim: true}))
            .pipe(gulp.dest(sourcesPath));
        const manifestStream = gulp
            .src(manifestPath)
            .pipe((() => {
                return through2.obj(function (fileObject, encoding, callback) {
                    if (!fileObject.isBuffer()) {
                        return callback(new PluginError(PLUGIN_NAME, 'Non-Buffer content is not supported'));
                    }

                    try {
                        const untransformedJson = JSON.parse(fileObject.contents.toString('utf8'));
                        const transformedJson = Object.entries(untransformedJson)
                            .filter(([key, value]) => !value.endsWith(`.${sourcesType}.map`))
                            .reduce((accumulator, [key, value]) => Object.assign(accumulator, {[key]: value}), {});

                        fileObject.contents = new Buffer(JSON.stringify(transformedJson, null, 2));

                        this.push(fileObject);

                        return callback();
                    } catch (error) {
                        return callback(new PluginError(PLUGIN_NAME, error));
                    }
                });
            })())
            .pipe(gulp.dest(path.parse(manifestPath).dir));

        return mergeStream(sourcesStream, manifestStream);
    };
}
