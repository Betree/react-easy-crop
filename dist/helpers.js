'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true,
})
exports.getCropSize = getCropSize
exports.restrictPosition = restrictPosition
exports.getDistanceBetweenPoints = getDistanceBetweenPoints
exports.getRotationBetweenPoints = getRotationBetweenPoints
exports.computeCroppedArea = computeCroppedArea
exports.getInitialCropFromCroppedAreaPixels = getInitialCropFromCroppedAreaPixels
exports.getCenter = getCenter
exports.rotateAroundMidPoint = rotateAroundMidPoint
exports.translateSize = translateSize

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest()
}

function _nonIterableRest() {
  throw new TypeError('Invalid attempt to destructure non-iterable instance')
}

function _iterableToArrayLimit(arr, i) {
  if (
    !(
      Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === '[object Arguments]'
    )
  ) {
    return
  }
  var _arr = []
  var _n = true
  var _d = false
  var _e = undefined
  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value)
      if (i && _arr.length === i) break
    }
  } catch (err) {
    _d = true
    _e = err
  } finally {
    try {
      if (!_n && _i['return'] != null) _i['return']()
    } finally {
      if (_d) throw _e
    }
  }
  return _arr
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object)
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object)
    if (enumerableOnly)
      symbols = symbols.filter(function(sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable
      })
    keys.push.apply(keys, symbols)
  }
  return keys
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {}
    if (i % 2) {
      ownKeys(source, true).forEach(function(key) {
        _defineProperty(target, key, source[key])
      })
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source))
    } else {
      ownKeys(source).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key))
      })
    }
  }
  return target
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true,
    })
  } else {
    obj[key] = value
  }
  return obj
}

/**
 * Compute the dimension of the crop area based on image size,
 * aspect ratio and optionally rotatation
 * @param {number} imgWidth width of the src image in pixels
 * @param {number} imgHeight height of the src image in pixels
 * @param {number} aspect aspect ratio of the crop
 * @param {rotation} rotation rotation in degrees
 */
function getCropSize(imgWidth, imgHeight, aspect) {
  var rotation = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0

  var _translateSize = translateSize(imgWidth, imgHeight, rotation),
    width = _translateSize.width,
    height = _translateSize.height

  if (imgWidth >= imgHeight * aspect && width > imgHeight * aspect) {
    return {
      width: imgHeight * aspect,
      height: imgHeight,
    }
  }

  if (width > imgHeight * aspect) {
    return {
      width: imgWidth,
      height: imgWidth / aspect,
    }
  }

  if (width > height * aspect) {
    return {
      width: height * aspect,
      height: height,
    }
  }

  return {
    width: width,
    height: width / aspect,
  }
}
/**
 * Ensure a new image position stays in the crop area.
 * @param {{x: number, y number}} position new x/y position requested for the image
 * @param {{width: number, height: number}} imageSize width/height of the src image
 * @param {{width: number, height: number}} cropSize width/height of the crop area
 * @param {number} zoom zoom value
 * @param {rotation} rotation rotation in degrees
 * @returns {{x: number, y number}}
 */

function restrictPosition(position, imageSize, cropSize, zoom) {
  var rotation = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0

  var _translateSize2 = translateSize(imageSize.width, imageSize.height, rotation),
    width = _translateSize2.width,
    height = _translateSize2.height

  return {
    x: restrictPositionCoord(position.x, width, cropSize.width, zoom),
    y: restrictPositionCoord(position.y, height, cropSize.height, zoom),
  }
}

function restrictPositionCoord(position, imageSize, cropSize, zoom) {
  var maxPosition = (imageSize * zoom) / 2 - cropSize / 2
  return Math.min(maxPosition, Math.max(position, -maxPosition))
}

function getDistanceBetweenPoints(pointA, pointB) {
  return Math.sqrt(Math.pow(pointA.y - pointB.y, 2) + Math.pow(pointA.x - pointB.x, 2))
}

function getRotationBetweenPoints(pointA, pointB) {
  return (Math.atan2(pointB.y - pointA.y, pointB.x - pointA.x) * 180) / Math.PI
}
/**
 * Compute the output cropped area of the image in percentages and pixels.
 * x/y are the top-left coordinates on the src image
 * @param {{x: number, y number}} crop x/y position of the current center of the image
 * @param {{width: number, height: number, naturalWidth: number, naturelHeight: number}} imageSize width/height of the src image (default is size on the screen, natural is the original size)
 * @param {{width: number, height: number}} cropSize width/height of the crop area
 * @param {number} aspect aspect value
 * @param {number} zoom zoom value
 * @param {boolean} restrictPosition whether we should limit or not the cropped area
 */

function computeCroppedArea(crop, imgSize, cropSize, aspect, zoom) {
  var restrictPosition = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : true
  var limitAreaFn = restrictPosition ? limitArea : noOp
  var croppedAreaPercentages = {
    x: limitAreaFn(
      100,
      (((imgSize.width - cropSize.width / zoom) / 2 - crop.x / zoom) / imgSize.width) * 100
    ),
    y: limitAreaFn(
      100,
      (((imgSize.height - cropSize.height / zoom) / 2 - crop.y / zoom) / imgSize.height) * 100
    ),
    width: limitAreaFn(100, ((cropSize.width / imgSize.width) * 100) / zoom),
    height: limitAreaFn(100, ((cropSize.height / imgSize.height) * 100) / zoom),
  } // we compute the pixels size naively

  var widthInPixels = limitAreaFn(
    imgSize.naturalWidth,
    (croppedAreaPercentages.width * imgSize.naturalWidth) / 100,
    true
  )
  var heightInPixels = limitAreaFn(
    imgSize.naturalHeight,
    (croppedAreaPercentages.height * imgSize.naturalHeight) / 100,
    true
  )
  var isImgWiderThanHigh = imgSize.naturalWidth >= imgSize.naturalHeight * aspect // then we ensure the width and height exactly match the aspect (to avoid rounding approximations)
  // if the image is wider than high, when zoom is 0, the crop height will be equals to iamge height
  // thus we want to compute the width from the height and aspect for accuracy.
  // Otherwise, we compute the height from width and aspect.

  var sizePixels = isImgWiderThanHigh
    ? {
        width: Math.round(heightInPixels * aspect),
        height: heightInPixels,
      }
    : {
        width: widthInPixels,
        height: Math.round(widthInPixels / aspect),
      }

  var croppedAreaPixels = _objectSpread({}, sizePixels, {
    x: limitAreaFn(
      imgSize.naturalWidth - sizePixels.width,
      (croppedAreaPercentages.x * imgSize.naturalWidth) / 100,
      true
    ),
    y: limitAreaFn(
      imgSize.naturalHeight - sizePixels.height,
      (croppedAreaPercentages.y * imgSize.naturalHeight) / 100,
      true
    ),
  })

  return {
    croppedAreaPercentages: croppedAreaPercentages,
    croppedAreaPixels: croppedAreaPixels,
  }
}
/**
 * Ensure the returned value is between 0 and max
 * @param {number} max
 * @param {number} value
 * @param {boolean} shouldRound
 */

function limitArea(max, value) {
  var shouldRound = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false
  var v = shouldRound ? Math.round(value) : value
  return Math.min(max, Math.max(0, v))
}

function noOp(max, value) {
  return value
}
/**
 * Compute the crop and zoom from the croppedAreaPixels
 * @param {{x: number, y: number, width: number, height: number}} croppedAreaPixels
 * @param {{width: number, height: number, naturalWidth: number, naturelHeight: number}} imageSize width/height of the src image (default is size on the screen, natural is the original size)
 */

function getInitialCropFromCroppedAreaPixels(croppedAreaPixels, imageSize) {
  var aspect = croppedAreaPixels.width / croppedAreaPixels.height
  var imageZoom = imageSize.width / imageSize.naturalWidth
  var isHeightMaxSize = imageSize.naturalWidth >= imageSize.naturalHeight * aspect
  var zoom = isHeightMaxSize
    ? imageSize.naturalHeight / croppedAreaPixels.height
    : imageSize.naturalWidth / croppedAreaPixels.width
  var cropZoom = imageZoom * zoom
  var crop = {
    x: ((imageSize.naturalWidth - croppedAreaPixels.width) / 2 - croppedAreaPixels.x) * cropZoom,
    y: ((imageSize.naturalHeight - croppedAreaPixels.height) / 2 - croppedAreaPixels.y) * cropZoom,
  }
  return {
    crop: crop,
    zoom: zoom,
  }
}
/**
 * Return the point that is the center of point a and b
 * @param {{x: number, y: number}} a
 * @param {{x: number, y: number}} b
 */

function getCenter(a, b) {
  return {
    x: (b.x + a.x) / 2,
    y: (b.y + a.y) / 2,
  }
}
/**
 *
 * Returns an x,y point once rotated around xMid,yMid
 * @param {number} x
 * @param {number} y
 * @param {number} xMid
 * @param {number} yMid
 * @param {number} degrees
 */

function rotateAroundMidPoint(x, y, xMid, yMid, degrees) {
  var cos = Math.cos
  var sin = Math.sin
  var radian = (degrees * Math.PI) / 180 // Convert to radians
  // Subtract midpoints, so that midpoint is translated to origin
  // and add it in the end again

  var xr = (x - xMid) * cos(radian) - (y - yMid) * sin(radian) + xMid
  var yr = (x - xMid) * sin(radian) + (y - yMid) * cos(radian) + yMid
  return [xr, yr]
}
/**
 *
 * Returns the new bounding area of a rotated rectangle.
 * @param {number} width
 * @param {number} height
 * @param {number} rotation
 */

function translateSize(width, height, rotation) {
  var centerX = width / 2
  var centerY = height / 2
  var outerBounds = [
    rotateAroundMidPoint(0, 0, centerX, centerY, rotation),
    rotateAroundMidPoint(width, 0, centerX, centerY, rotation),
    rotateAroundMidPoint(width, height, centerX, centerY, rotation),
    rotateAroundMidPoint(0, height, centerX, centerY, rotation),
  ]

  var _outerBounds$reduce = outerBounds.reduce(function(res, _ref) {
      var _ref2 = _slicedToArray(_ref, 2),
        x = _ref2[0],
        y = _ref2[1]

      return {
        minX: Math.min(x, 'minX' in res ? res.minX : x),
        maxX: Math.max(x, 'maxX' in res ? res.maxX : x),
        minY: Math.min(y, 'minY' in res ? res.minY : y),
        maxY: Math.max(y, 'maxY' in res ? res.maxY : y),
      }
    }, {}),
    minX = _outerBounds$reduce.minX,
    maxX = _outerBounds$reduce.maxX,
    minY = _outerBounds$reduce.minY,
    maxY = _outerBounds$reduce.maxY

  return {
    width: maxX - minX,
    height: maxY - minY,
  }
}
