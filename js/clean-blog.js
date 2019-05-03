(function($) {
  "use strict"; // Start of use strict

  // Floating label headings for the contact form
  $("body").on("input propertychange", ".floating-label-form-group", function(e) {
    $(this).toggleClass("floating-label-form-group-with-value", !!$(e.target).val());
  }).on("focus", ".floating-label-form-group", function() {
    $(this).addClass("floating-label-form-group-with-focus");
  }).on("blur", ".floating-label-form-group", function() {
    $(this).removeClass("floating-label-form-group-with-focus");
  });

  // Show the navbar when the page is scrolled up
  var MQL = 992;

  //primary navigation slide-in effect
  if ($(window).width() > MQL) {
    var headerHeight = $('#mainNav').height();
    $(window).on('scroll', {
        previousTop: 0
      },
      function() {
        var currentTop = $(window).scrollTop();
        //check if user is scrolling up
        if (currentTop < this.previousTop) {
          //if scrolling up...
          if (currentTop > 0 && $('#mainNav').hasClass('is-fixed')) {
            $('#mainNav').addClass('is-visible');
          } else {
            $('#mainNav').removeClass('is-visible is-fixed');
          }
        } else if (currentTop > this.previousTop) {
          //if scrolling down...
          $('#mainNav').removeClass('is-visible');
          if (currentTop > headerHeight && !$('#mainNav').hasClass('is-fixed')) $('#mainNav').addClass('is-fixed');
        }
        this.previousTop = currentTop;
      });
  }


  

})(jQuery); // End of use strict


(function($) {
  "use strict";

  $(function() {
    var $window = $(window),
        windowWidth = $window.width(),
        windowHeight = $window.height(),
        animDuration = 600,
        $sliderWrapper = $(".custom-advanced-slider-sp"),
        //Autoplay global variables
        timer = null,
        playTimes,
        //Basic webGL renderers
        rendererOuterID = "custom-advanced-slider-sp-canvas-outer",
        rendererCanvasID = "custom-advanced-slider-sp-canvas",
        renderer,
        //Three.js
        scenesAll = [],
        texturesAll = [],
        webGLRenderer;

    sliderInit(false);

    $window.on("resize", function() {
      // Check window width has actually changed and it's not just iOS triggering a resize event on scroll
      if ($window.width() != windowWidth) {
        // Update the window width for next time
        windowWidth = $window.width();

        sliderInit(true);
      }
    });

    /*
		 * Initialize slideshow
		 *
		 * @param  {boolean} resize            - Determine whether the window size changes.
		 * @return {void}                   - The constructor.
		 */
    function sliderInit(resize) {
      $sliderWrapper.each(function() {
        var $this = $(this),
            $items = $this.find(".item"),
            $first = $items.first(),
            nativeItemW,
            nativeItemH;

        //Initialize the first item container
        //-------------------------------------
        $first.addClass("active");

        var imgURL = $first.find("img").attr("src"),
            img = new Image();

        img.onload = function() {
          $this.css(
            "height",
            $this.width() * (this.height / this.width) + "px"
          );

          nativeItemW = this.width;
          nativeItemH = this.height;

          //Initialize all the items to the stage
          addItemsToStage($this, $sliderWrapper, nativeItemW, nativeItemH);
        };

        img.src = imgURL;

        //Autoplay Slider
        //-------------------------------------
        if (!resize) {
          var dataAuto = $this.data("auto"),
              dataTiming = $this.data("timing"),
              dataLoop = $this.data("loop");

          if (typeof dataAuto === typeof undefined) dataAuto = false;
          if (typeof dataTiming === typeof undefined) dataTiming = 10000;
          if (typeof dataLoop === typeof undefined) dataLoop = false;

          if (
            dataAuto &&
            !isNaN(parseFloat(dataTiming)) &&
            isFinite(dataTiming)
          ) {
            sliderAutoPlay(dataTiming, $items, dataLoop);

            $this.on({
              mouseenter: function() {
                clearInterval(timer);
              },
              mouseleave: function() {
                sliderAutoPlay(dataTiming, $items, dataLoop);
              }
            });
          }
        }
      });
    }

    /*
		 * Trigger slider autoplay
		 *
		 * @param  {number} timing           - Autoplay interval.
		 * @param  {object} items            - Each item in current slider.
		 * @param  {boolean} loop            - Determine whether to loop through each item.
		 * @return {void}                    - The constructor.
		 */
    function sliderAutoPlay(timing, items, loop) {
      var total = items.length;

      timer = setInterval(function() {
        playTimes = parseFloat(items.filter(".active").index());
        playTimes++;

        if (!loop) {
          if (playTimes < total && playTimes >= 0)
            sliderUpdates(playTimes, $sliderWrapper);
        } else {
          if (playTimes == total) playTimes = 0;
          if (playTimes < 0) playTimes = total - 1;
          sliderUpdates(playTimes, $sliderWrapper);
        }
      }, timing);
    }

    /*
		 * Initialize all the items to the stage
		 *
		 * @param  {object} slider           - Current selector of each slider.
		 * @param  {object} sliderWrapper    - Wrapper of the slider.
		 * @param  {number} nativeItemW      - Returns the intrinsic width of the image/video.
		 * @param  {number} nativeItemH      - Returns the intrinsic height of the image/video.
		 * @return {void}                    - The constructor.
		 */
    function addItemsToStage(slider, sliderWrapper, nativeItemW, nativeItemH) {
      var $this = slider,
          $items = $this.find(".item"),
          $first = $items.first(),
          itemsTotal = $items.length,
          timerEvtStop = null,
          dataControlsPagination = $this.data("controls-pagination"),
          dataControlsArrows = $this.data("controls-arrows"),
          dataLoop = $this.data("loop"),
          dataAuto = $this.data("auto"),
          dataTiming = $this.data("timing");

      if (typeof dataControlsPagination === typeof undefined)
        dataControlsPagination = ".custom-advanced-slider-sp-pagination";
      if (typeof dataControlsArrows === typeof undefined)
        dataControlsArrows = ".custom-advanced-slider-sp-arrows";
      if (typeof dataLoop === typeof undefined) dataLoop = false;
      if (typeof dataAuto === typeof undefined) dataAuto = false;
      if (typeof dataTiming === typeof undefined) dataTiming = 10000;

      //Prevent bubbling
      if (itemsTotal == 1) {
        $(dataControlsPagination).hide();
        $(dataControlsArrows).hide();
      }

      //Load slides to canvas
      //-------------------------------------
      if ($("#" + rendererCanvasID).length == 0) {
        $this.prepend(
          '<div id="' +
          rendererOuterID +
          '" class="custom-advanced-slider-sp-canvas-outer"><canvas id="' +
          rendererCanvasID +
          '"></canvas></div>'
        );
      }

      //----------------------------------------------------------------------------------
      //--------------------------------- 3D Rotating Effect -----------------------------
      //----------------------------------------------------------------------------------
      //Usage of returning sprite object: texturesAll[ index ]     scenesAll[ index ]
      if ($this.hasClass("eff-3d-rotating")) {
        var texture;

        //Drag and Drop
        var targetRotationX = 0,
            targetRotationXOnMouseDown = 0,
            targetRotationXOnTouchDown = 0,
            targetRotationY = 0,
            targetRotationYOnMouseDown = 0,
            targetRotationYOnTouchDown = 0,
            mouseX = 0,
            mouseY = 0,
            mouseXOnMouseDown = 0,
            mouseXOnTouchDown = 0,
            mouseYOnMouseDown = 0,
            mouseYOnTouchDown = 0,
            windowHalfX = $this.width() / 2,
            windowHalfY = $this.height() / 2;

        //Add Geometries and Lights to the main container
        //-------------------------------------
        var init = function() {
          $this.find(".item").each(function(index) {
            var $thisItem = $(this);

            // create a scene, that will hold all our elements such as objects, cameras and lights.
            var scene = new THREE.Scene();
            scene.name = "scene-" + index;

            // make a list item
            var element = document.createElement("div");
            element.className = "list-item";
            element.innerHTML =
              '<div class="scene" style="width:' +
              $this.width() +
              "px;height:" +
              $this.height() +
              'px;"></div>';

            // Look up the element that represents the area
            // we want to render the scene
            scene.userData.element = element.querySelector(".scene");
            document.getElementById(rendererOuterID).appendChild(element);

            TweenMax.set($("#" + rendererOuterID).find(".list-item"), {
              alpha: 0,
              css: {
                display: "none"
              }
            });

            // Create a camera, which defines where we're looking at.
            var aspect = $this.width() / $this.height(),
                camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 1000);

            camera.position.x = 0;
            camera.position.y = -30;
            camera.position.z = 25;
            camera.lookAt(new THREE.Vector3(0, 0, 0));
            scene.userData.camera = camera;

            // Generate one plane geometries mesh to each scene

            texture = new THREE.TextureLoader().load(
              $thisItem.find("img").attr("src")
            );
            texture.generateMipmaps = false;
            texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.minFilter = THREE.LinearFilter;

            // texture controller
            texturesAll.push(texture);

            // Immediately use the texture for material creation
            var spriteMat = new THREE.MeshPhongMaterial({ map: texture }),
                imgRatio = $this.width() / $this.height(),
                geometry = new THREE.BoxGeometry(imgRatio * 15, 15, 2),
                displacementSprite = new THREE.Mesh(geometry, spriteMat);

            displacementSprite.position.set(-0.01, -0.01, 0);
            displacementSprite.rotation.set(0, 0, 0);
            scene.add(displacementSprite);

            // Generate Ambient Light
            var ambiLight = new THREE.AmbientLight(0x404040);
            scene.add(ambiLight);

            // Generate Directional Light
            var light = new THREE.DirectionalLight(0xffffff, 0.5);
            light.position.set(0, 30, 70);
            scene.add(light);

            // Display multiple instances of three.js in a single page
            scenesAll.push(scene);
          });

          //Create a render and set the size
          webGLRenderer = new THREE.WebGLRenderer({
            canvas: document.getElementById(rendererCanvasID), //canvas
            alpha: true,
            antialias: true
          });

          webGLRenderer.setClearColor(new THREE.Color(0x000000, 0));
          webGLRenderer.setPixelRatio(window.devicePixelRatio);
          webGLRenderer.shadowMap.enabled = true;
        };

        //Add render event
        //-------------------------------------

        //Converts numeric degrees to radians
        var toRad = function(number) {
          return number * Math.PI / 180;
        };

        var render = function() {
          webGLRenderer.setClearColor(0x000000);
          webGLRenderer.setScissorTest(false);
          webGLRenderer.clear();

          webGLRenderer.setClearColor(0x000000);
          webGLRenderer.setScissorTest(true);

          scenesAll.forEach(function(scene, i) {
            // Get the element that is a place holder for where we want to draw the scene
            var element = scene.userData.element,
                camera = scene.userData.camera,
                rect = element.getBoundingClientRect();

            //automatic rotation
            scene.children[0].rotation.y = Date.now() * 0.0001;

            //drag & drop
            //						scene.children[0].rotation.x = toRad( targetRotationX * 4 );
            //						scene.children[0].rotation.y = toRad( targetRotationY * 4 );
            //
            //drag & drop with easing effect
            scene.children[0].rotation.x +=
              (targetRotationX - scene.children[0].rotation.x) * 0.05;
            scene.children[0].rotation.y +=
              (targetRotationY - scene.children[0].rotation.y) * 0.05;

            // set the viewport
            webGLRenderer.setViewport(0, 0, rect.width, rect.height);
            webGLRenderer.setScissor(0, 0, rect.width, rect.height);

            //tell texture object it needs to be updated
            texture.needsUpdate = true;

            camera.aspect = $this.width() / $this.height(); // not changing in this example
            camera.updateProjectionMatrix();

            //drag & drop
            webGLRenderer.render(scene, camera);
          });
        };

        //Animation Effects
        //-------------------------------------
        var animate = function() {
          render();
          requestAnimationFrame(animate);
        };

        init();
        animate();

        //Rotation and Drop

        var onDocumentMouseDown = function(e) {
          e.preventDefault();
          document.addEventListener("mousemove", onDocumentMouseMove, false);
          document.addEventListener("mouseup", onDocumentMouseUp, false);
          document.addEventListener("mouseout", onDocumentMouseOut, false);
          mouseXOnMouseDown = e.clientX - windowHalfX;
          mouseYOnMouseDown = e.clientY - windowHalfY;
          targetRotationXOnMouseDown = targetRotationX;
          targetRotationYOnMouseDown = targetRotationY;
        };

        var onDocumentMouseMove = function(e) {
          mouseX = e.clientX - windowHalfX;
          mouseY = e.clientY - windowHalfY;
          targetRotationX =
            targetRotationXOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.02;
          targetRotationY =
            targetRotationYOnMouseDown + (mouseY - mouseYOnMouseDown) * 0.02;
        };

        var onDocumentMouseUp = function(e) {
          document.removeEventListener("mousemove", onDocumentMouseMove, false);
          document.removeEventListener("mouseup", onDocumentMouseUp, false);
          document.removeEventListener("mouseout", onDocumentMouseOut, false);
        };

        var onDocumentMouseOut = function(e) {
          document.removeEventListener("mousemove", onDocumentMouseMove, false);
          document.removeEventListener("mouseup", onDocumentMouseUp, false);
          document.removeEventListener("mouseout", onDocumentMouseOut, false);
        };

        var onDocumentTouchStart = function(e) {
          e.preventDefault();
          e = e.changedTouches[0];

          document.addEventListener("touchmove", onDocumentTouchMove, false);
          document.addEventListener("touchend", onDocumentTouchEnd, false);
          mouseXOnTouchDown = e.clientX - windowHalfX;
          mouseYOnTouchDown = e.clientY - windowHalfY;
          targetRotationXOnTouchDown = targetRotationX;
          targetRotationYOnTouchDown = targetRotationY;
        };

        var onDocumentTouchMove = function(e) {
          e.preventDefault();
          e = e.changedTouches[0];

          mouseX = e.clientX - windowHalfX;
          mouseY = e.clientY - windowHalfY;
          targetRotationX =
            targetRotationXOnTouchDown + (mouseX - mouseXOnTouchDown) * 0.02;
          targetRotationY =
            targetRotationYOnTouchDown + (mouseY - mouseYOnTouchDown) * 0.02;
        };

        var onDocumentTouchEnd = function(e) {
          document.removeEventListener("touchmove", onDocumentTouchMove, false);
          document.removeEventListener("touchend", onDocumentTouchEnd, false);
        };

        if (Modernizr.touchevents) {
          document.addEventListener("touchstart", onDocumentTouchStart, false);
        } else {
          document.addEventListener("mousedown", onDocumentMouseDown, false);
        }

        //Responsive plane geometries
        //-------------------------------------
        var width = windowWidth;
        var height = windowHeight;

        if (
          document.getElementById(rendererCanvasID).width !== width ||
          document.getElementById(rendererCanvasID).height !== height
        ) {
          webGLRenderer.setSize(width, height, false);
        }

        window.addEventListener(
          "resize",
          function() {
            var width = document.getElementById(rendererCanvasID).clientWidth;
            var height = document.getElementById(rendererCanvasID).clientHeight;

            if (
              document.getElementById(rendererCanvasID).width !== width ||
              document.getElementById(rendererCanvasID).height !== height
            ) {
              webGLRenderer.setSize(width, height, false);
            }
          },
          false
        );

        //Initialize the default height of canvas
        //-------------------------------------
        setTimeout(function() {
          canvasDefaultInit($first);
        }, animDuration);
      } // end effect

      //Canvas Interactions
      //-------------------------------------
      transitionInteractions(0, $this, "in");

      //Autoplay Slider
      //-------------------------------------
      if (dataAuto && !isNaN(parseFloat(dataTiming)) && isFinite(dataTiming)) {
        var playTimes = 0;
        timerEvtStop = false;

        // change item
        setInterval(function() {
          if (timerEvtStop) return;

          setTimeout(function() {
            if (playTimes == itemsTotal) playTimes = 0;
            if (playTimes < 0) playTimes = itemsTotal - 1;

            sliderUpdates(playTimes, sliderWrapper);

            playTimes++;
          }, dataTiming);
        }, dataTiming);
      }

      $this.on("mouseout", function() {
        timerEvtStop = false;
      });

      //Pagination dots
      //-------------------------------------
      var _dot = "",
          _dotActive = "";
      _dot += "<ul>";
      for (var i = 0; i < itemsTotal; i++) {
        _dotActive = i == 0 ? 'class="active"' : "";

        _dot +=
          "<li><a " +
          _dotActive +
          ' data-index="' +
          i +
          '" href="javascript:"></a></li>';
      }
      _dot += "</ul>";

      if ($(dataControlsPagination).html() == "")
        $(dataControlsPagination).html(_dot);

      $(dataControlsPagination)
        .find("li a")
        .on("click", function(e) {
        e.preventDefault();

        if (!$(this).hasClass("active")) {
          //Canvas Interactions
          transitionInteractions(
            $items.filter(".active").index(),
            sliderWrapper,
            "out"
          );

          //Update the current and previous/next items
          sliderUpdates($(this).attr("data-index"), sliderWrapper);

          //Pause the auto play event
          timerEvtStop = true;
        }
      });

      //Next/Prev buttons
      //-------------------------------------
      var _prev = $(dataControlsArrows).find(".prev"),
          _next = $(dataControlsArrows).find(".next");

      $(dataControlsArrows)
        .find("a")
        .attr("href", "javascript:");

      $(dataControlsArrows)
        .find("a")
        .removeClass("disabled");
      if (!dataLoop) {
        _prev.addClass("disabled");
      }

      _prev.on("click", function(e) {
        e.preventDefault();

        //Canvas Interactions
        transitionInteractions(
          $items.filter(".active").index(),
          sliderWrapper,
          "out"
        );

        //Update the current and previous items
        sliderUpdates(
          parseFloat($items.filter(".active").index()) - 1,
          sliderWrapper
        );

        //Pause the auto play event
        timerEvtStop = true;
      });

      _next.on("click", function(e) {
        e.preventDefault();

        //Canvas Interactions
        transitionInteractions(
          $items.filter(".active").index(),
          sliderWrapper,
          "out"
        );

        //Update the current and next items
        sliderUpdates(
          parseFloat($items.filter(".active").index()) + 1,
          sliderWrapper
        );

        //Pause the auto play event
        timerEvtStop = true;
      });

      //Added touch method to mobile device
      //-------------------------------------
      var startX, startY;

      $this.on("touchstart.advancedSlider", function(event) {
        var touches = event.originalEvent.touches;
        if (touches && touches.length) {
          startX = touches[0].pageX;
          startY = touches[0].pageY;

          $this.on("touchmove.advancedSlider", function(event) {
            var touches = event.originalEvent.touches;
            if (touches && touches.length) {
              var deltaX = startX - touches[0].pageX,
                  deltaY = startY - touches[0].pageY;

              if (deltaX >= 50) {
                //--- swipe left

                sliderUpdates(
                  parseFloat($items.filter(".active").index()) + 1,
                  sliderWrapper
                );

                //Pause the auto play event
                timerEvtStop = true;
              }
              if (deltaX <= -50) {
                //--- swipe right

                sliderUpdates(
                  parseFloat($items.filter(".active").index()) - 1,
                  sliderWrapper
                );

                //Pause the auto play event
                timerEvtStop = true;
              }
              if (deltaY >= 50) {
                //--- swipe up
              }
              if (deltaY <= -50) {
                //--- swipe down
              }
              if (Math.abs(deltaX) >= 50 || Math.abs(deltaY) >= 50) {
                $this.off("touchmove.advancedSlider");
              }
            }
          });
        }
      });
    }

    /*
		 * Transition Between Slides
		 *
		 * @param  {number} elementIndex     - Index of current slider.
		 * @param  {object} slider           - Selector of the slider .
		 * @return {void}                    - The constructor.
		 */
    function sliderUpdates(elementIndex, slider) {
      var $items = slider.find(".item"),
          $current = $items.eq(elementIndex),
          total = $items.length,
          dataCountTotal = slider.data("count-total"),
          dataCountCur = slider.data("count-now"),
          dataControlsPagination = slider.data("controls-pagination"),
          dataControlsArrows = slider.data("controls-arrows"),
          dataLoop = slider.data("loop"),
          dataAuto = slider.data("auto");

      if (typeof dataCountTotal === typeof undefined)
        dataCountTotal = "p.count em.count";
      if (typeof dataCountCur === typeof undefined)
        dataCountCur = "p.count em.current";
      if (typeof dataControlsPagination === typeof undefined)
        dataControlsPagination = ".custom-advanced-slider-sp-pagination";
      if (typeof dataControlsArrows === typeof undefined)
        dataControlsArrows = ".custom-advanced-slider-sp-arrows";
      if (typeof dataLoop === typeof undefined) dataLoop = false;
      if (typeof dataAuto === typeof undefined) dataAuto = false;

      //Prevent bubbling
      if (total == 1) {
        $(dataControlsPagination).hide();
        $(dataControlsArrows).hide();
        return false;
      }

      //Transition Interception
      //-------------------------------------
      if (dataLoop) {
        if (elementIndex == total) elementIndex = 0;
        if (elementIndex < 0) elementIndex = total - 1;
      } else {
        $(dataControlsArrows)
          .find("a")
          .removeClass("disabled");
        if (elementIndex == total - 1)
          $(dataControlsArrows)
            .find(".next")
            .addClass("disabled");
        if (elementIndex == 0)
          $(dataControlsArrows)
            .find(".prev")
            .addClass("disabled");
      }

      // To determine if it is a touch screen.
      if (Modernizr.touchevents) {
        if (elementIndex == total) elementIndex = total - 1;
        if (elementIndex < 0) elementIndex = 0;

        //Prevent bubbling
        if (!dataLoop) {
          //first item
          if (elementIndex == 0) {
            $(dataControlsArrows)
              .find(".prev")
              .addClass("disabled");
          }

          //last item
          if (elementIndex == total - 1) {
            $(dataControlsArrows)
              .find(".next")
              .addClass("disabled");
          }
        }
      }

      $(dataControlsPagination)
        .find("li a")
        .removeClass("leave");
      $(dataControlsPagination)
        .find("li a.active")
        .removeClass("active")
        .addClass("leave");
      $(dataControlsPagination)
        .find('li a[data-index="' + elementIndex + '"]')
        .addClass("active")
        .removeClass("leave");

      $items.removeClass("leave");
      slider
        .find(".item.active")
        .removeClass("active")
        .addClass("leave");
      $items
        .eq(elementIndex)
        .addClass("active")
        .removeClass("leave");

      //Display counter
      //-------------------------------------
      $(dataCountTotal).text(total);
      $(dataCountCur).text(parseFloat(elementIndex) + 1);

      //Reset the default height of canvas
      //-------------------------------------
      setTimeout(function() {
        canvasDefaultInit($current);
      }, animDuration);

      //Canvas Interactions
      //-------------------------------------
      transitionInteractions(elementIndex, slider, "in");
    }

    /*
		 * Initialize the default height of canvas
		 *
		 * @param  {object} slider           - Current selector of each slider.
		 * @return {void}                    - The constructor.
		 */
    function canvasDefaultInit(slider) {
      var imgURL = slider.find("img").attr("src"),
          img = new Image();

      img.onload = function() {
        renderer.view.style.height = slider.find("img").height() + "px";
        //---
        $sliderWrapper.css(
          "height",
          slider.closest(".custom-advanced-slider-outer").width() *
          (this.height / this.width) +
          "px"
        );
      };

      img.src = imgURL;
    }

    /*
		 * Canvas Transition Interactions
		 *
		 * @param  {number} elementIndex     - Index of current slider.
		 * @param  {object} slider           - Selector of the slider.
		 * @param  {string} goType           - The type of entry and exit between two items.  
		                                       Optional values: in, out
		 * @return {void}                    - The constructor.
		 */
    function transitionInteractions(elementIndex, slider, goType) {
      var $myRenderer = $("#" + rendererOuterID),
          $current = slider.find(".item").eq(elementIndex),
          imgSel = $current.find("img"),
          curImgURL = imgSel.attr("src"),
          stageW = slider.width(),
          stageH = slider.height(),
          spTotal = slider.find(".item").length;

      //----------------------------------------------------------------------------------
      //--------------------------------- 3D Rotating Effect -----------------------------
      //----------------------------------------------------------------------------------
      if (slider.hasClass("eff-3d-rotating")) {
        //Display wrapper of canvas (transitions between slides)
        //-------------------------------------

        if (goType == "out") {
          //Current item leaving action

          //rotation transition
          TweenMax.to(
            scenesAll[elementIndex].children[0].rotation,
            animDuration / 1000,
            {
              x: "+=2",
              y: "+=2"
            }
          );
        } else {
          //Current item entry action

          TweenMax.to($myRenderer, animDuration / 1000, {
            alpha: 0,
            onComplete: function() {
              var curSp = $myRenderer.find(".list-item").eq(elementIndex);

              TweenMax.to(this.target, animDuration / 1000, {
                alpha: 1
              });

              //display the current item
              TweenMax.set($myRenderer.find(".list-item"), {
                alpha: 0,
                css: {
                  display: "none"
                }
              });

              //display filters
              TweenMax.to(curSp, animDuration / 1000, {
                alpha: 1,
                css: {
                  display: "block"
                }
              });
            }
          });
        }
      } // end effect
    }
  });

})(jQuery);
(function($) {
  "use strict";
})(jQuery);


(function($) {
  "use strict";

  $(function() {
    var $window = $(window),
        windowWidth = $window.width(),
        windowHeight = $window.height(),
        animDuration = 600,
        $sliderWrapper = $(".custom-advanced-slider-sp"),
        //Autoplay global variables
        timer = null,
        playTimes,
        //Basic webGL renderers
        rendererOuterID = "custom-advanced-slider-sp-canvas-outer",
        rendererCanvasID = "custom-advanced-slider-sp-canvas",
        renderer,
        //Three.js
        scenesAll = [],
        texturesAll = [],
        webGLRenderer;

    sliderInit(false);

    $window.on("resize", function() {
      // Check window width has actually changed and it's not just iOS triggering a resize event on scroll
      if ($window.width() != windowWidth) {
        // Update the window width for next time
        windowWidth = $window.width();

        sliderInit(true);
      }
    });

    /*
		 * Initialize slideshow
		 *
		 * @param  {boolean} resize            - Determine whether the window size changes.
		 * @return {void}                   - The constructor.
		 */
    function sliderInit(resize) {
      $sliderWrapper.each(function() {
        var $this = $(this),
            $items = $this.find(".item"),
            $first = $items.first(),
            nativeItemW,
            nativeItemH;

        //Initialize the first item container
        //-------------------------------------
        $first.addClass("active");

        var imgURL = $first.find("img").attr("src"),
            img = new Image();

        img.onload = function() {
          $this.css(
            "height",
            $this.width() * (this.height / this.width) + "px"
          );

          nativeItemW = this.width;
          nativeItemH = this.height;

          //Initialize all the items to the stage
          addItemsToStage($this, $sliderWrapper, nativeItemW, nativeItemH);
        };

        img.src = imgURL;

        //Autoplay Slider
        //-------------------------------------
        if (!resize) {
          var dataAuto = $this.data("auto"),
              dataTiming = $this.data("timing"),
              dataLoop = $this.data("loop");

          if (typeof dataAuto === typeof undefined) dataAuto = false;
          if (typeof dataTiming === typeof undefined) dataTiming = 10000;
          if (typeof dataLoop === typeof undefined) dataLoop = false;

          if (
            dataAuto &&
            !isNaN(parseFloat(dataTiming)) &&
            isFinite(dataTiming)
          ) {
            sliderAutoPlay(dataTiming, $items, dataLoop);

            $this.on({
              mouseenter: function() {
                clearInterval(timer);
              },
              mouseleave: function() {
                sliderAutoPlay(dataTiming, $items, dataLoop);
              }
            });
          }
        }
      });
    }

    /*
		 * Trigger slider autoplay
		 *
		 * @param  {number} timing           - Autoplay interval.
		 * @param  {object} items            - Each item in current slider.
		 * @param  {boolean} loop            - Determine whether to loop through each item.
		 * @return {void}                    - The constructor.
		 */
    function sliderAutoPlay(timing, items, loop) {
      var total = items.length;

      timer = setInterval(function() {
        playTimes = parseFloat(items.filter(".active").index());
        playTimes++;

        if (!loop) {
          if (playTimes < total && playTimes >= 0)
            sliderUpdates(playTimes, $sliderWrapper);
        } else {
          if (playTimes == total) playTimes = 0;
          if (playTimes < 0) playTimes = total - 1;
          sliderUpdates(playTimes, $sliderWrapper);
        }
      }, timing);
    }

    /*
		 * Initialize all the items to the stage
		 *
		 * @param  {object} slider           - Current selector of each slider.
		 * @param  {object} sliderWrapper    - Wrapper of the slider.
		 * @param  {number} nativeItemW      - Returns the intrinsic width of the image/video.
		 * @param  {number} nativeItemH      - Returns the intrinsic height of the image/video.
		 * @return {void}                    - The constructor.
		 */
    function addItemsToStage(slider, sliderWrapper, nativeItemW, nativeItemH) {
      var $this = slider,
          $items = $this.find(".item"),
          $first = $items.first(),
          itemsTotal = $items.length,
          timerEvtStop = null,
          dataControlsPagination = $this.data("controls-pagination"),
          dataControlsArrows = $this.data("controls-arrows"),
          dataLoop = $this.data("loop"),
          dataAuto = $this.data("auto"),
          dataTiming = $this.data("timing");

      if (typeof dataControlsPagination === typeof undefined)
        dataControlsPagination = ".custom-advanced-slider-sp-pagination";
      if (typeof dataControlsArrows === typeof undefined)
        dataControlsArrows = ".custom-advanced-slider-sp-arrows";
      if (typeof dataLoop === typeof undefined) dataLoop = false;
      if (typeof dataAuto === typeof undefined) dataAuto = false;
      if (typeof dataTiming === typeof undefined) dataTiming = 10000;

      //Prevent bubbling
      if (itemsTotal == 1) {
        $(dataControlsPagination).hide();
        $(dataControlsArrows).hide();
      }

      //Load slides to canvas
      //-------------------------------------
      if ($("#" + rendererCanvasID).length == 0) {
        $this.prepend(
          '<div id="' +
          rendererOuterID +
          '" class="custom-advanced-slider-sp-canvas-outer"><canvas id="' +
          rendererCanvasID +
          '"></canvas></div>'
        );
      }

      //----------------------------------------------------------------------------------
      //--------------------------------- 3D Rotating Effect -----------------------------
      //----------------------------------------------------------------------------------
      //Usage of returning sprite object: texturesAll[ index ]     scenesAll[ index ]
      if ($this.hasClass("eff-3d-rotating")) {
        var texture;

        //Drag and Drop
        var targetRotationX = 0,
            targetRotationXOnMouseDown = 0,
            targetRotationXOnTouchDown = 0,
            targetRotationY = 0,
            targetRotationYOnMouseDown = 0,
            targetRotationYOnTouchDown = 0,
            mouseX = 0,
            mouseY = 0,
            mouseXOnMouseDown = 0,
            mouseXOnTouchDown = 0,
            mouseYOnMouseDown = 0,
            mouseYOnTouchDown = 0,
            windowHalfX = $this.width() / 2,
            windowHalfY = $this.height() / 2;

        //Add Geometries and Lights to the main container
        //-------------------------------------
        var init = function() {
          $this.find(".item").each(function(index) {
            var $thisItem = $(this);

            // create a scene, that will hold all our elements such as objects, cameras and lights.
            var scene = new THREE.Scene();
            scene.name = "scene-" + index;

            // make a list item
            var element = document.createElement("div");
            element.className = "list-item";
            element.innerHTML =
              '<div class="scene" style="width:' +
              $this.width() +
              "px;height:" +
              $this.height() +
              'px;"></div>';

            // Look up the element that represents the area
            // we want to render the scene
            scene.userData.element = element.querySelector(".scene");
            document.getElementById(rendererOuterID).appendChild(element);

            TweenMax.set($("#" + rendererOuterID).find(".list-item"), {
              alpha: 0,
              css: {
                display: "none"
              }
            });

            // Create a camera, which defines where we're looking at.
            var aspect = $this.width() / $this.height(),
                camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 1000);

            camera.position.x = 0;
            camera.position.y = -30;
            camera.position.z = 25;
            camera.lookAt(new THREE.Vector3(0, 0, 0));
            scene.userData.camera = camera;

            // Generate one plane geometries mesh to each scene

            texture = new THREE.TextureLoader().load(
              $thisItem.find("img").attr("src")
            );
            texture.generateMipmaps = false;
            texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.minFilter = THREE.LinearFilter;

            // texture controller
            texturesAll.push(texture);

            // Immediately use the texture for material creation
            var spriteMat = new THREE.MeshPhongMaterial({ map: texture }),
                imgRatio = $this.width() / $this.height(),
                geometry = new THREE.BoxGeometry(imgRatio * 15, 15, 2),
                displacementSprite = new THREE.Mesh(geometry, spriteMat);

            displacementSprite.position.set(-0.01, -0.01, 0);
            displacementSprite.rotation.set(0, 0, 0);
            scene.add(displacementSprite);

            // Generate Ambient Light
            var ambiLight = new THREE.AmbientLight(0x404040);
            scene.add(ambiLight);

            // Generate Directional Light
            var light = new THREE.DirectionalLight(0xffffff, 0.5);
            light.position.set(0, 30, 70);
            scene.add(light);

            // Display multiple instances of three.js in a single page
            scenesAll.push(scene);
          });

          //Create a render and set the size
          webGLRenderer = new THREE.WebGLRenderer({
            canvas: document.getElementById(rendererCanvasID), //canvas
            alpha: true,
            antialias: true
          });

          webGLRenderer.setClearColor(new THREE.Color(0x000000, 0));
          webGLRenderer.setPixelRatio(window.devicePixelRatio);
          webGLRenderer.shadowMap.enabled = true;
        };

        //Add render event
        //-------------------------------------

        //Converts numeric degrees to radians
        var toRad = function(number) {
          return number * Math.PI / 180;
        };

        var render = function() {
          webGLRenderer.setClearColor(0x000000);
          webGLRenderer.setScissorTest(false);
          webGLRenderer.clear();

          webGLRenderer.setClearColor(0x000000);
          webGLRenderer.setScissorTest(true);

          scenesAll.forEach(function(scene, i) {
            // Get the element that is a place holder for where we want to draw the scene
            var element = scene.userData.element,
                camera = scene.userData.camera,
                rect = element.getBoundingClientRect();

            //automatic rotation
            scene.children[0].rotation.y = Date.now() * 0.0001;

            //drag & drop
            //						scene.children[0].rotation.x = toRad( targetRotationX * 4 );
            //						scene.children[0].rotation.y = toRad( targetRotationY * 4 );
            //
            //drag & drop with easing effect
            scene.children[0].rotation.x +=
              (targetRotationX - scene.children[0].rotation.x) * 0.05;
            scene.children[0].rotation.y +=
              (targetRotationY - scene.children[0].rotation.y) * 0.05;

            // set the viewport
            webGLRenderer.setViewport(0, 0, rect.width, rect.height);
            webGLRenderer.setScissor(0, 0, rect.width, rect.height);

            //tell texture object it needs to be updated
            texture.needsUpdate = true;

            camera.aspect = $this.width() / $this.height(); // not changing in this example
            camera.updateProjectionMatrix();

            //drag & drop
            webGLRenderer.render(scene, camera);
          });
        };

        //Animation Effects
        //-------------------------------------
        var animate = function() {
          render();
          requestAnimationFrame(animate);
        };

        init();
        animate();

        //Rotation and Drop

        var onDocumentMouseDown = function(e) {
          e.preventDefault();
          document.addEventListener("mousemove", onDocumentMouseMove, false);
          document.addEventListener("mouseup", onDocumentMouseUp, false);
          document.addEventListener("mouseout", onDocumentMouseOut, false);
          mouseXOnMouseDown = e.clientX - windowHalfX;
          mouseYOnMouseDown = e.clientY - windowHalfY;
          targetRotationXOnMouseDown = targetRotationX;
          targetRotationYOnMouseDown = targetRotationY;
        };

        var onDocumentMouseMove = function(e) {
          mouseX = e.clientX - windowHalfX;
          mouseY = e.clientY - windowHalfY;
          targetRotationX =
            targetRotationXOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.02;
          targetRotationY =
            targetRotationYOnMouseDown + (mouseY - mouseYOnMouseDown) * 0.02;
        };

        var onDocumentMouseUp = function(e) {
          document.removeEventListener("mousemove", onDocumentMouseMove, false);
          document.removeEventListener("mouseup", onDocumentMouseUp, false);
          document.removeEventListener("mouseout", onDocumentMouseOut, false);
        };

        var onDocumentMouseOut = function(e) {
          document.removeEventListener("mousemove", onDocumentMouseMove, false);
          document.removeEventListener("mouseup", onDocumentMouseUp, false);
          document.removeEventListener("mouseout", onDocumentMouseOut, false);
        };

        var onDocumentTouchStart = function(e) {
          e.preventDefault();
          e = e.changedTouches[0];

          document.addEventListener("touchmove", onDocumentTouchMove, false);
          document.addEventListener("touchend", onDocumentTouchEnd, false);
          mouseXOnTouchDown = e.clientX - windowHalfX;
          mouseYOnTouchDown = e.clientY - windowHalfY;
          targetRotationXOnTouchDown = targetRotationX;
          targetRotationYOnTouchDown = targetRotationY;
        };

        var onDocumentTouchMove = function(e) {
          e.preventDefault();
          e = e.changedTouches[0];

          mouseX = e.clientX - windowHalfX;
          mouseY = e.clientY - windowHalfY;
          targetRotationX =
            targetRotationXOnTouchDown + (mouseX - mouseXOnTouchDown) * 0.02;
          targetRotationY =
            targetRotationYOnTouchDown + (mouseY - mouseYOnTouchDown) * 0.02;
        };

        var onDocumentTouchEnd = function(e) {
          document.removeEventListener("touchmove", onDocumentTouchMove, false);
          document.removeEventListener("touchend", onDocumentTouchEnd, false);
        };

        if (Modernizr.touchevents) {
          document.addEventListener("touchstart", onDocumentTouchStart, false);
        } else {
          document.addEventListener("mousedown", onDocumentMouseDown, false);
        }

        //Responsive plane geometries
        //-------------------------------------
        var width = windowWidth;
        var height = windowHeight;

        if (
          document.getElementById(rendererCanvasID).width !== width ||
          document.getElementById(rendererCanvasID).height !== height
        ) {
          webGLRenderer.setSize(width, height, false);
        }

        window.addEventListener(
          "resize",
          function() {
            var width = document.getElementById(rendererCanvasID).clientWidth;
            var height = document.getElementById(rendererCanvasID).clientHeight;

            if (
              document.getElementById(rendererCanvasID).width !== width ||
              document.getElementById(rendererCanvasID).height !== height
            ) {
              webGLRenderer.setSize(width, height, false);
            }
          },
          false
        );

        //Initialize the default height of canvas
        //-------------------------------------
        setTimeout(function() {
          canvasDefaultInit($first);
        }, animDuration);
      } // end effect

      //Canvas Interactions
      //-------------------------------------
      transitionInteractions(0, $this, "in");

      //Autoplay Slider
      //-------------------------------------
      if (dataAuto && !isNaN(parseFloat(dataTiming)) && isFinite(dataTiming)) {
        var playTimes = 0;
        timerEvtStop = false;

        // change item
        setInterval(function() {
          if (timerEvtStop) return;

          setTimeout(function() {
            if (playTimes == itemsTotal) playTimes = 0;
            if (playTimes < 0) playTimes = itemsTotal - 1;

            sliderUpdates(playTimes, sliderWrapper);

            playTimes++;
          }, dataTiming);
        }, dataTiming);
      }

      $this.on("mouseout", function() {
        timerEvtStop = false;
      });

      //Pagination dots
      //-------------------------------------
      var _dot = "",
          _dotActive = "";
      _dot += "<ul>";
      for (var i = 0; i < itemsTotal; i++) {
        _dotActive = i == 0 ? 'class="active"' : "";

        _dot +=
          "<li><a " +
          _dotActive +
          ' data-index="' +
          i +
          '" href="javascript:"></a></li>';
      }
      _dot += "</ul>";

      if ($(dataControlsPagination).html() == "")
        $(dataControlsPagination).html(_dot);

      $(dataControlsPagination)
        .find("li a")
        .on("click", function(e) {
        e.preventDefault();

        if (!$(this).hasClass("active")) {
          //Canvas Interactions
          transitionInteractions(
            $items.filter(".active").index(),
            sliderWrapper,
            "out"
          );

          //Update the current and previous/next items
          sliderUpdates($(this).attr("data-index"), sliderWrapper);

          //Pause the auto play event
          timerEvtStop = true;
        }
      });

      //Next/Prev buttons
      //-------------------------------------
      var _prev = $(dataControlsArrows).find(".prev"),
          _next = $(dataControlsArrows).find(".next");

      $(dataControlsArrows)
        .find("a")
        .attr("href", "javascript:");

      $(dataControlsArrows)
        .find("a")
        .removeClass("disabled");
      if (!dataLoop) {
        _prev.addClass("disabled");
      }

      _prev.on("click", function(e) {
        e.preventDefault();

        //Canvas Interactions
        transitionInteractions(
          $items.filter(".active").index(),
          sliderWrapper,
          "out"
        );

        //Update the current and previous items
        sliderUpdates(
          parseFloat($items.filter(".active").index()) - 1,
          sliderWrapper
        );

        //Pause the auto play event
        timerEvtStop = true;
      });

      _next.on("click", function(e) {
        e.preventDefault();

        //Canvas Interactions
        transitionInteractions(
          $items.filter(".active").index(),
          sliderWrapper,
          "out"
        );

        //Update the current and next items
        sliderUpdates(
          parseFloat($items.filter(".active").index()) + 1,
          sliderWrapper
        );

        //Pause the auto play event
        timerEvtStop = true;
      });

      //Added touch method to mobile device
      //-------------------------------------
      var startX, startY;

      $this.on("touchstart.advancedSlider", function(event) {
        var touches = event.originalEvent.touches;
        if (touches && touches.length) {
          startX = touches[0].pageX;
          startY = touches[0].pageY;

          $this.on("touchmove.advancedSlider", function(event) {
            var touches = event.originalEvent.touches;
            if (touches && touches.length) {
              var deltaX = startX - touches[0].pageX,
                  deltaY = startY - touches[0].pageY;

              if (deltaX >= 50) {
                //--- swipe left

                sliderUpdates(
                  parseFloat($items.filter(".active").index()) + 1,
                  sliderWrapper
                );

                //Pause the auto play event
                timerEvtStop = true;
              }
              if (deltaX <= -50) {
                //--- swipe right

                sliderUpdates(
                  parseFloat($items.filter(".active").index()) - 1,
                  sliderWrapper
                );

                //Pause the auto play event
                timerEvtStop = true;
              }
              if (deltaY >= 50) {
                //--- swipe up
              }
              if (deltaY <= -50) {
                //--- swipe down
              }
              if (Math.abs(deltaX) >= 50 || Math.abs(deltaY) >= 50) {
                $this.off("touchmove.advancedSlider");
              }
            }
          });
        }
      });
    }

    /*
		 * Transition Between Slides
		 *
		 * @param  {number} elementIndex     - Index of current slider.
		 * @param  {object} slider           - Selector of the slider .
		 * @return {void}                    - The constructor.
		 */
    function sliderUpdates(elementIndex, slider) {
      var $items = slider.find(".item"),
          $current = $items.eq(elementIndex),
          total = $items.length,
          dataCountTotal = slider.data("count-total"),
          dataCountCur = slider.data("count-now"),
          dataControlsPagination = slider.data("controls-pagination"),
          dataControlsArrows = slider.data("controls-arrows"),
          dataLoop = slider.data("loop"),
          dataAuto = slider.data("auto");

      if (typeof dataCountTotal === typeof undefined)
        dataCountTotal = "p.count em.count";
      if (typeof dataCountCur === typeof undefined)
        dataCountCur = "p.count em.current";
      if (typeof dataControlsPagination === typeof undefined)
        dataControlsPagination = ".custom-advanced-slider-sp-pagination";
      if (typeof dataControlsArrows === typeof undefined)
        dataControlsArrows = ".custom-advanced-slider-sp-arrows";
      if (typeof dataLoop === typeof undefined) dataLoop = false;
      if (typeof dataAuto === typeof undefined) dataAuto = false;

      //Prevent bubbling
      if (total == 1) {
        $(dataControlsPagination).hide();
        $(dataControlsArrows).hide();
        return false;
      }

      //Transition Interception
      //-------------------------------------
      if (dataLoop) {
        if (elementIndex == total) elementIndex = 0;
        if (elementIndex < 0) elementIndex = total - 1;
      } else {
        $(dataControlsArrows)
          .find("a")
          .removeClass("disabled");
        if (elementIndex == total - 1)
          $(dataControlsArrows)
            .find(".next")
            .addClass("disabled");
        if (elementIndex == 0)
          $(dataControlsArrows)
            .find(".prev")
            .addClass("disabled");
      }

      // To determine if it is a touch screen.
      if (Modernizr.touchevents) {
        if (elementIndex == total) elementIndex = total - 1;
        if (elementIndex < 0) elementIndex = 0;

        //Prevent bubbling
        if (!dataLoop) {
          //first item
          if (elementIndex == 0) {
            $(dataControlsArrows)
              .find(".prev")
              .addClass("disabled");
          }

          //last item
          if (elementIndex == total - 1) {
            $(dataControlsArrows)
              .find(".next")
              .addClass("disabled");
          }
        }
      }

      $(dataControlsPagination)
        .find("li a")
        .removeClass("leave");
      $(dataControlsPagination)
        .find("li a.active")
        .removeClass("active")
        .addClass("leave");
      $(dataControlsPagination)
        .find('li a[data-index="' + elementIndex + '"]')
        .addClass("active")
        .removeClass("leave");

      $items.removeClass("leave");
      slider
        .find(".item.active")
        .removeClass("active")
        .addClass("leave");
      $items
        .eq(elementIndex)
        .addClass("active")
        .removeClass("leave");

      //Display counter
      //-------------------------------------
      $(dataCountTotal).text(total);
      $(dataCountCur).text(parseFloat(elementIndex) + 1);

      //Reset the default height of canvas
      //-------------------------------------
      setTimeout(function() {
        canvasDefaultInit($current);
      }, animDuration);

      //Canvas Interactions
      //-------------------------------------
      transitionInteractions(elementIndex, slider, "in");
    }

    /*
		 * Initialize the default height of canvas
		 *
		 * @param  {object} slider           - Current selector of each slider.
		 * @return {void}                    - The constructor.
		 */
    function canvasDefaultInit(slider) {
      var imgURL = slider.find("img").attr("src"),
          img = new Image();

      img.onload = function() {
        renderer.view.style.height = slider.find("img").height() + "px";
        //---
        $sliderWrapper.css(
          "height",
          slider.closest(".custom-advanced-slider-outer").width() *
          (this.height / this.width) +
          "px"
        );
      };

      img.src = imgURL;
    }

    /*
		 * Canvas Transition Interactions
		 *
		 * @param  {number} elementIndex     - Index of current slider.
		 * @param  {object} slider           - Selector of the slider.
		 * @param  {string} goType           - The type of entry and exit between two items.  
		                                       Optional values: in, out
		 * @return {void}                    - The constructor.
		 */
    function transitionInteractions(elementIndex, slider, goType) {
      var $myRenderer = $("#" + rendererOuterID),
          $current = slider.find(".item").eq(elementIndex),
          imgSel = $current.find("img"),
          curImgURL = imgSel.attr("src"),
          stageW = slider.width(),
          stageH = slider.height(),
          spTotal = slider.find(".item").length;

      //----------------------------------------------------------------------------------
      //--------------------------------- 3D Rotating Effect -----------------------------
      //----------------------------------------------------------------------------------
      if (slider.hasClass("eff-3d-rotating")) {
        //Display wrapper of canvas (transitions between slides)
        //-------------------------------------

        if (goType == "out") {
          //Current item leaving action

          //rotation transition
          TweenMax.to(
            scenesAll[elementIndex].children[0].rotation,
            animDuration / 1000,
            {
              x: "+=2",
              y: "+=2"
            }
          );
        } else {
          //Current item entry action

          TweenMax.to($myRenderer, animDuration / 1000, {
            alpha: 0,
            onComplete: function() {
              var curSp = $myRenderer.find(".list-item").eq(elementIndex);

              TweenMax.to(this.target, animDuration / 1000, {
                alpha: 1
              });

              //display the current item
              TweenMax.set($myRenderer.find(".list-item"), {
                alpha: 0,
                css: {
                  display: "none"
                }
              });

              //display filters
              TweenMax.to(curSp, animDuration / 1000, {
                alpha: 1,
                css: {
                  display: "block"
                }
              });
            }
          });
        }
      } // end effect
    }
  });
})(jQuery);
