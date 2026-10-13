/* START TIME — deck configuration. */
window.ST=window.ST||{};
ST.CONFIG={
  deck:'p1a',
  /* where these topics sit on the sheet's Access tab (Part row and Section row keys) */
  part:'Part 1', partKey:'P1', section:'Section A', sectionKey:'P1-A',

  /* Start screen: the deck opens only with a valid code. Student and trainer codes are both checked against the instructor's Google Sheet. */
  gate:true,

  /* Google Apps Script web-app URL (ends in /exec) that checks codes and stores student progress.
     A public endpoint, not a secret. Empty = codes cannot be checked yet. */
  syncUrl:'https://script.google.com/macros/s/AKfycbzzx1rLvNPV6lBq7MnVp4e-_ONfozdvqZYsrW1UsU7QRwKnKV8P08luIK3Sdxargx8p/exec',


  /* Fallback only. Once the sheet answers, the Roles tab of the instructor's Google Sheet decides who sees each feature
     (Owner / Teacher / Assistant / Student). These lists apply when the sheet does not name a feature.
     'trainer' = any staff role. In "Student view" the student list applies. */
  features:{
    answers:   ['trainer'],            /* "Show answer" on practice slides and the show-all-answers switch */
    answerKey: ['trainer'],            /* answer key at the end of printed handouts */
    language:  ['trainer'],            /* English / Arabic switch (when Arabic content is available) */
    notes:     ['trainer'],            /* instructor notes on slides */
    print:     ['trainer','student'],  /* Print / PDF handouts */
    excel:     ['trainer','student'],  /* Excel export of tables */
    studentView:['trainer'],           /* staff: switch to Student view */
    markRead:  ['trainer','student'],  /* "Mark as read" button under concept slides */
    viewFit:   ['trainer','student'],  /* slide view: one screen (presenting) */
    viewSplit: ['trainer','student'],  /* slide view: in parts, large text */
    listen:    ['trainer'],            /* Listen: lessons */
    listenBank:['trainer'],            /* Listen: question bank */
    listenAuto:['trainer'],            /* Listen: hands-free */
    listenRecord:['trainer']           /* Listen: record MP3 (computer) */
  }
};
