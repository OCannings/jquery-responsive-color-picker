(function($) {
  var DEFAULT_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAoElEQVR42u3QwQkAMBDDsOy/dDrD/VIQeACjNBksFSxYsGDBgiVYsGDBggVLsGDBggULlmDBggULFizBggULFixYggULFixYsAQLFixYsGAJFixYsGDB0u9Ym19tBoMFCxYsWLBgwYIFCxYsWLBgwYIFCxYsWLBgwYIFCxYsWLBgwYIFCxYsWLBgwYIFCxYsWLBgwYIFCxYsWLBgwYJ16AG7GKX9cdhSlQAAAABJRU5ErkJggg==";

  function loadImage(url) {
    var dfd = $.Deferred();
    var img = document.createElement('img');

    img.onload = function() {
      dfd.resolve(img);
    }

    img.onerror = dfd.reject;

    img.src = url;

    return dfd.promise();
  }

  function $createCanvas() {
    return $('<canvas style="width: 100%" />');
  }

  function Spectrum(canvas) {
    this.width = this.height = 0;
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
  }

  Spectrum.prototype = {
    _renderSpectrum: function(img) {
       this.width  = this.ctx.canvas.width  = img.width;
       this.height = this.ctx.canvas.height = img.height;
       this.ctx.drawImage(img, 0, 0);
    },

    loadSpectrum: function(url) {
      loadImage(url).then(this._renderSpectrum.bind(this));
    },

    getPixel: function(x, y) {
      var $canvas = $(this.canvas);
      // adjust to compensate for CSS scaling of canvas
      x = Math.floor((x / $canvas.width())  * this.ctx.canvas.width);
      y = Math.floor((y / $canvas.height()) * this.ctx.canvas.height);

      return this.ctx.getImageData(x, y, 1, 1).data;
    }
  };

  function moveCrossHair($crosshair, x, y, width, height) {
    $crosshair.css({
      position: 'absolute',
      transform: 'translate(-50%, -50%)',
      'pointer-events': 'none',
      top: (y / height) * 100 + '%',
      left: (x / width) * 100 + '%'
    }).show();
  }

  function getEventCoords(e, $canvas) {
    var offset = $canvas.offset();

    function handleTouchEvent(e) {
      var touches = e.originalEvent.touches;

      if (touches && touches.length) {
        var touch = touches[0];

        return {
          x: touch.clientX - offset.left,
          y: touch.clientY - offset.top
        }
      }
    }

    function handleMouseEvent(e) {
      return {
        x: e.pageX - offset.left,
        y: e.pageY - offset.top
      }
    }

    function clip(pos, width, height) {
      pos.x = Math.max(pos.x, 0);
      pos.y = Math.max(pos.y, 0);

      pos.x = Math.min(pos.x, $canvas.width());
      pos.y = Math.min(pos.y, $canvas.height());

      return pos;
    }

    return clip(handleTouchEvent(e) || handleMouseEvent(e));
  }

  $.fn.pixelPicker = function(opts) {
    var settings = $.extend({},
        $.fn.pixelPicker.default,
        opts);

    var $canvas = $createCanvas();
    var spectrum = new Spectrum($canvas.get(0));

    var $this = this;
    var $window = $(window);
    var $crosshair = this.find('[data-crosshair]');

    $crosshair.hide();

    function pickColour(spectrum, x, y) {
      $this.trigger('pixelpicker:change', {
        rgba: spectrum.getPixel(x, y)
      });
    }

    function pickColourFromEvent(e) {
      e.preventDefault();
      var pos = getEventCoords(e, $canvas);

      moveCrossHair($crosshair, pos.x, pos.y, $canvas.width(), $canvas.height());
      pickColour(spectrum, pos.x, pos.y);
    }

    $canvas.on('mousedown touchstart', function(e) {
      $window.on('mouseup', function mouseUp(e) {
        pickColourFromEvent(e);

        $window.off('mousemove touchmove', pickColourFromEvent);
        $window.off('mouseup', mouseUp);
      });

      $window.on('mousemove touchmove', pickColourFromEvent);
    });

    this.append($canvas);

    $.each(settings.spectrum, function(mq, url) {
      var mm = window.matchMedia(mq);

      function match(mm) {
        if (mm.matches) {
          spectrum.loadSpectrum(url);
          $crosshair.hide();
        }
      }

      mm.addListener(match);
      match(mm);
    });

    return this;
  }

  $.fn.pixelPicker.defaults = {
    spectrum: {
      'default': DEFAULT_IMAGE
    }
  };
}(jQuery));
