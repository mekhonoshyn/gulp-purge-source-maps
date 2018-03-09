'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _del = require('del');

var _del2 = _interopRequireDefault(_del);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _gulp = require('gulp');

var _gulp2 = _interopRequireDefault(_gulp);

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _pluginError = require('plugin-error');

var _pluginError2 = _interopRequireDefault(_pluginError);

var _gulpDecomment = require('gulp-decomment');

var _gulpDecomment2 = _interopRequireDefault(_gulpDecomment);

var _mergeStream = require('merge-stream');

var _mergeStream2 = _interopRequireDefault(_mergeStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

exports.default = purgeSourceMaps;


var PLUGIN_NAME = 'gulp-purge-source-maps';

function purgeSourceMaps(_ref) {
    var sourcesType = _ref.sourcesType,
        manifestPath = _ref.manifestPath,
        sourcesPath = _ref.sourcesPath;

    return function () {
        (0, _del2.default)(_path2.default.join(sourcesPath, '*.' + sourcesType + '.map'));

        var sourcesStream = _gulp2.default.src(_path2.default.join(sourcesPath, '*.' + sourcesType)).pipe(_gulpDecomment2.default.text({ trim: true })).pipe(_gulp2.default.dest(sourcesPath));
        var manifestStream = _gulp2.default.src(manifestPath).pipe(function () {
            return _through2.default.obj(function (fileObject, encoding, callback) {
                if (!fileObject.isBuffer()) {
                    return callback(new _pluginError2.default(PLUGIN_NAME, 'Non-Buffer content is not supported'));
                }

                try {
                    var untransformedJson = JSON.parse(fileObject.contents.toString());
                    var transformedJson = Object.entries(untransformedJson).filter(function (_ref2) {
                        var _ref3 = _slicedToArray(_ref2, 2),
                            value = _ref3[1];

                        return !value.endsWith('.' + sourcesType + '.map');
                    }).reduce(function (accumulator, _ref4) {
                        var _ref5 = _slicedToArray(_ref4, 2),
                            key = _ref5[0],
                            value = _ref5[1];

                        return Object.assign(accumulator, _defineProperty({}, key, value));
                    }, {});
                    var content = JSON.stringify(transformedJson, null, 2);

                    fileObject.contents = Buffer.from(content);

                    this.push(fileObject);

                    return callback();
                } catch (error) {
                    return callback(new _pluginError2.default(PLUGIN_NAME, error));
                }
            });
        }()).pipe(_gulp2.default.dest(_path2.default.parse(manifestPath).dir));

        return (0, _mergeStream2.default)(sourcesStream, manifestStream);
    };
}