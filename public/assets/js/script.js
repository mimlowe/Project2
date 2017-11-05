var allRiffs;
var riffsPlaying = [];
var currentRiff;
var modalLoop;

var loop1;
var loop2;

var modalStep = 0;
var loop1Step = 0;
var loop2Step = 0;

var currentSequence;

//use these to update/insert db
let modalSequence = [' ', ' ', ' ', ' ',
                     ' ', ' ', ' ', ' ',
                     ' ', ' ', ' ', ' ',
                     ' ', ' ', ' ', ' '];
let modalBeat = 8; 

var synth;
var synth1;
var synth2;
var isPlaying = false;

Tone.Transport.start();

$.ajax({
  url: '/api/riffs/all',
  method: "GET"
}).done(function(riffs) {
  allRiffs = riffs;
  for (var i = 0; i < allRiffs.length; i++) {
    riffsPlaying.push(0);
  }
  console.log(riffsPlaying);
});

StartAudioContext(Tone.context, "article").then(function() {
  // let openPlay = false;

  //opens modal when click on tile
  $('article').on('click', function (evt) {

    Tone.Transport.stop();

    if (evt.target.id === 'favorite') return;
    if (evt.target.className.indexOf('fa') > -1) return;
    if (loop1) {
      loop1.stop(.01);
    }
    if (loop2) {
      loop2.stop(.01);
    }

    $('.modal').addClass('is-active');
    
    var riffId = $(this).data('id');

    if (riffId !== '') {

      var url = '/api/riffs/' + riffId;
      $.ajax({
        url: url,
        method: "GET"
      }).done(function(riff) {
        // set tempo to riff's tempo
        Tone.Transport.bpm.value = 120;

        //get step array
        modalSequence = getStepArray(riff.sequence);
        modalBeat = riff.beat_division;

        //set riff name
        $('#modal-title-input').attr('placeholder', riff.title);
      
        $.each($('.modal-step'), function(index, value) {
          $(this).text(modalSequence[index]);
        });
        defineLoop(modalSequence, modalBeat);
      });
    } else {
      $.each($('.modal-step'), function(index, value) {
        $(this).text(modalSequence[index]);
      });
      defineLoop(modalSequence, modalBeat);
      $('#modal-title-input').attr('placeholder', 'New Riff');
    }
  });

  function defineLoop (seq, beat) { 
   // keep track of which step in the sequence we're on
    // var step = 0;

    // create instrument
    synth = new Tone.PolySynth(8, Tone.Synth).toMaster();

    // initialize loop with parameters from riff
    modalLoop = new Tone.Loop(function(time) {
      if (modalStep >= seq.length) {
        modalStep = 0;
      }
      $('.modal-step').each(function () {
        $(this).removeClass('active-step');
      });
      $(`#modal-step-${modalStep}`).addClass('active-step');

      if (seq[modalStep] != " ") {
        synth.triggerAttackRelease(seq[modalStep], "8n", time);
      }

      modalStep++;

    }, `${beat}n`);
  };

  $("#cn-button").on("click", function(event) {
    
    let $wrap = $('#cn-wrapper');

    if (modalLoop.state === "started") {
      isPlaying = false;
      modalLoop.stop(.01);
      Tone.Transport.stop();
      $wrap.removeClass('opened-nav');
      toggleStart('modal-control-icon', isPlaying);
    } else {
      Tone.Transport.start();
      setTimeout(function() {
        modalLoop.start(0.01);
        isPlaying = true;
        toggleStart('modal-control-icon', isPlaying);
      }, 3);
      $wrap.addClass('opened-nav');
    }

  });

  $('.modal-beat-sel').on('click', function () {
    modalLoop.stop(.01);
    Tone.Transport.stop();
    isPlaying = false;
    modalBeat = $(this).data('id');
    $('.csstransforms .cn-wrapper li a').addClass('is-beat');
    modalLoop = undefined;
    defineLoop(modalSequence, modalBeat);
    Tone.Transport.start();
    setTimeout(function() {
      modalLoop.start(0.01);
      isPlaying = true;
    }, 3);
  });

  // Play the sequence that was clicked
  $('.control-play').on('click', function(event) {

    var id = $(this).data('id');

    var index;

    for (var i = 0; i < allRiffs.length; i++) {
      if (allRiffs[i].id === id) {
        index = i;
        break;
      }
    }

    var riffValue = riffsPlaying[index];

    var arraySum = riffsPlaying.reduce(function(a, b) {
      return a + b;
    }, 0);

    // if no loop is assigned
    if (arraySum === 0) {
      seq = allRiffs[index].sequence;

      synth1 = new Tone.PolySynth(8, Tone.Synth).toMaster();

      // initialize loop1
      loop1 = new Tone.Loop(function(time) {
        if (loop1Step >= seq.length) {
          loop1Step = 0;
        }

        if (seq[loop1Step] != " ") {
          synth1.triggerAttackRelease(seq[loop1Step], "8n", time);
        }

        loop1Step++;

      }, "8n");

      Tone.Transport.start();
      setTimeout(function() {
        loop1.start(0.01);
      }, 3);
       
      return false;
    }

    // if both loops are assigned
    if (arraySum === 3) {
      // if both loops are playing
      if (loop1.state === "started" & loop2.state === "started") {
        // if this loop is not one of the active loops...
        if (riffValue === 0) {
          // do nothing
          return false;
        }
        // else, stop the appropriate loop
        if (riffValue === 1) {
          loop1.stop(0.1);
          return false;
        } else {
          loop2.stop(0.1);
          return false;
        }
      }

      // if just loop1 is playing...
      if (loop1.state === "started") {
        // if this loop is loop1 
        if (riffValue === 1) {
          loop1.stop(0.1);
          return false;
        } else {
          loop2.start(0.1);
          return false;
        }
      }

      // if just loop2 is playing 
      if (loop2.state === "started") {
        // if this loop is loop2
        if (riffValue === 2) {
          loop2.stop(0.1);
        } else {
          loop1.start(0.1);
        }
      }
      
    }

    console.log("SUM: " + arraySum);

    for (var i = 0; i < allRiffs.length; i++) {
      if (allRiffs[i].id === id) {
        currentRiff = allRiffs[i];
        break;
      }
    }

    // set tempo 
    Tone.Transport.bpm.value = currentRiff.tempo;

    // get sequence and format it
    currentSequence = getStepArray(currentRiff.sequence);

    // initialize instrument
    synth = new Tone.PolySynth(8, Tone.Synth).toMaster();

    // initialize loop
    loop = new Tone.Loop(function(time) {
      if (step >= currentSequence.length) {
        step = 0;
      }

      if (currentSequence[step] != " ") {
        synth.triggerAttackRelease(currentSequence[step], "8n", time);
      }

      step++;
    }, "8n");

    Tone.Transport.start();
    setTimeout(function() {
      loop.start(.01);
      isPlaying = true;
    }, 3);

  });

  //closes modal if clicking elements that have class 
  $('.close-modal').on('click', function () {
    $('.modal').removeClass('is-active');
    clearModal();
    modalLoop.stop(.01);
    modalLoop = null;
    isPlaying = false;
    toggleStart('modal-control-icon', isPlaying);
  });

  //closes modal if clicking off of modal
  $('.modal-background').on('click', function () {
    $('.modal').removeClass('is-active');
    clearModal();
    modalLoop.stop(.01);
    modalLoop = null;
    isPlaying = false;
    toggleStart('modal-control-icon', isPlaying);
  });

  //pick which notes are sent to steps
  $('.step-selector').on('click', function () {
    let that = this;

    if ($(this).hasClass('picked')) {
      $(this).removeClass('picked');
    } else {
      $.each($(".picked"), function () {
        $(this).removeClass('picked');
      });	
      $(this).addClass('picked');
    }

    if ($('#step-grid').find('.clicked').length !== 0) {
      $('.clicked').each(function () {
        $(this).html($(that).attr('value'));
        $(this).val($(that).attr('value'));
        modalSequence[parseInt($(this).data('id'))] = $(that).attr('value');
        $(this).removeClass('clicked');
        $(this).addClass('unclicked');
        $(that).removeClass('picked');
      });
    }
  });

  //steps clicked
  $('.modal-step').on('click', function () {
    if ($(this).hasClass('unclicked')) {
      $(this).removeClass('unclicked');
      $(this).addClass('clicked');

      if ($('.picked').attr('value') !== undefined) {
        $(this).html($('.picked').attr('value'));
        $(this).val($('.picked').attr('value'));
        modalSequence[parseInt($(this).data('id'))] = $('.picked').attr('value');
        $(this).addClass('unclicked');
        $(this).removeClass('clicked');
      } else {
        if ($(this).html() !== '') {
          $(this).empty();
          modalSequence[parseInt($(this).data('id'))] = ' ';
        }
      }
    } else {
      $(this).removeClass('clicked');
      $(this).addClass('unclicked');		
    }
  });

});

//clear step when modal closes
function clearModal() {
  $('.modal-step').each(function () {
    $(this).empty();
    $(this).addClass('unclicked');
    $(this).removeClass('clicked');
  });
  $('.step-selector').each(function () {
    $(this).removeClass('picked');
  });
  let $wrap = $('#cn-wrapper');
  $wrap.removeClass('opened-nav');
  modalSequence = [' ', ' ', ' ', ' ',
                   ' ', ' ', ' ', ' ',
                   ' ', ' ', ' ', ' ',
                   ' ', ' ', ' ', ' '];
  $('.modal-step').each(function () {
    $(this).removeClass('active-step');
  });
}

//toggling favorite star
$('.favorite').on('click', function () {
  if ($(this).hasClass('fa-star')) {
    $(this).removeClass('fa-star');
    $(this).addClass('fa-star-o');
  } else {
    $(this).removeClass('fa-star-o');
    $(this).addClass('fa-star');
  }
});

//altering to sharps and flats
$('.mod-check').on('click', function () {
  let key = $(this).attr('id')[0];
  let mod = $(this).attr('id')[1];
  let val = `${key}${mod}`;
  let p8 = $(`#${key}-p8-option`).val();

  if ($(`#${val}-check`).prop('checked')) {
    if (mod === 'b') $(`#${key}s-check`).prop('checked', false);
    else $(`#${key}b-check`).prop('checked', false);

    if (mod === 's') val = key + '#';
  } else {
    val = key;
  }

  $(`#${key}-step-selector`).attr('value', `${val}${p8}`);
});

//changing octaves
$('.p8-option').on('change', function () {
  let p8 = $(this).val();
  let key = $(this).attr('id')[0];
  let curVal = $(`#${key}-step-selector`).attr('value').slice(0,-1);
  $(`#${key}-step-selector`).attr('value', curVal+p8);
});

//takes in sequence from db and turns it into proper array
function getStepArray (dbString) {
  let seq = dbString.split(", ");

  seq[0] = seq[0].slice(1);
  seq[seq.length-1] = seq[seq.length-1].slice(0, -1);
  seq.forEach((el, i) => {
    seq[i] = el.slice(1,-1);
  });

  return seq;
}

//toggle start/stop button
function toggleStart (id, started) {
  let active = started ? 'fa-stop' : 'fa-play';
  let inactive = started ? 'fa-play' : 'fa-stop';
  $(`#${id}`).removeClass(inactive);
  $(`#${id}`).addClass(active);
}
