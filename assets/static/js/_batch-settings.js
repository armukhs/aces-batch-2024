// batch-settings.js
(function(){
  const btnSubmit = document.getElementById('settings-submit');
  const elmToggle = document.getElementById('settings-toggle');
  const elmDate = document.getElementById('batch-date');
  const elmMode = document.getElementById('batch-mode');
  const elmSelf = document.getElementById('mod-self');
  const elmCase = document.getElementById('mod-case');
  const elmF2f = document.getElementById('mod-f2f');
  const elmGroup = document.getElementById('mod-group');
  const elmSpanMode = document.getElementById('batch-mode-span');
  const date_v0 = elmDate.value;
  const mode_v0 = elmMode.value;
  const self_v0 = elmSelf.value;
  const case_v0 = elmCase.value;
  const f2f_v0 = elmF2f.value;
  const group_v0 = elmGroup.value;
  // -------
  function formChanged() {
    return date_v0 != elmDate.value
      || mode_v0 != elmMode.value
      || self_v0 != elmSelf.value
      || case_v0 != elmCase.value
      || f2f_v0 != elmF2f.value
      || group_v0 != elmGroup.value
  }
  // -------
  function canSubmit() {
    return elmDate.value && (elmSelf.value || elmCase.value || elmF2f.value || elmGroup.value)
  }
  // -------
  elmDate.addEventListener('keydown', (e) => {
    if (e.key == 'Enter') e.preventDefault()
  })
  // ------
  elmToggle.addEventListener('click', (e) => {
    if (elmDate.disabled) {
      elmDate.disabled = false
      elmSelf.disabled = false
      elmCase.disabled = false
      elmF2f.disabled = false
      elmGroup.disabled = false
    } else {
      elmDate.disabled = true
      elmSelf.disabled = true
      elmCase.disabled = true
      elmF2f.disabled = true
      elmGroup.disabled = true
    }
  })
  // let batchMode = null;
  function defineMode() {
    if (elmSelf.value && elmCase.value && elmF2f.value && elmGroup.value) {
      elmMode.value = 'BATCH-ALL-TYPES';
    }
    // 3
    else if (!elmSelf.value && elmCase.value && elmF2f.value && elmGroup.value) {
      elmMode.value = 'BATCH-NO-SELF';
    } else if (elmSelf.value && !elmCase.value && elmF2f.value && elmGroup.value) {
      elmMode.value = 'BATCH-NO-CASE';
    } else if (elmSelf.value && elmCase.value && !elmF2f.value && elmGroup.value) {
      elmMode.value = 'BATCH-NO-F2F';
    } else if (elmSelf.value && elmCase.value && elmF2f.value && !elmGroup.value) {
      elmMode.value = 'BATCH-NO-GROUP';
    }
    // 2
    else if (elmSelf.value && elmCase.value && !elmF2f.value && !elmGroup.value) {
      elmMode.value = 'BATCH-SELF-CASE';
    } else if (elmSelf.value && !elmCase.value && !elmF2f.value && elmGroup.value) {
      elmMode.value = 'BATCH-SELF-GROUP';
    } else if (elmSelf.value && !elmCase.value && elmF2f.value && !elmGroup.value) {
      elmMode.value = 'BATCH-SELF-F2F';
    } else if (!elmSelf.value && elmCase.value && !elmF2f.value && elmGroup.value) {
      elmMode.value = 'BATCH-CASE-GROUP';
    } else if (!elmSelf.value && elmCase.value && elmF2f.value && !elmGroup.value) {
      elmMode.value = 'BATCH-CASE-F2F';
    } else if (!elmSelf.value && !elmCase.value && elmF2f.value && elmGroup.value) {
      elmMode.value = 'BATCH-GROUP-F2F';
    }
    // 1
    else if (elmSelf.value && !elmCase.value && !elmF2f.value && !elmGroup.value) {
      elmMode.value = 'BATCH-SELF-ONLY';
    } else if (!elmSelf.value && elmCase.value && !elmF2f.value && !elmGroup.value) {
      elmMode.value = 'BATCH-CASE-ONLY';
    } else if (!elmSelf.value && !elmCase.value && !elmF2f.value && elmGroup.value) {
      elmMode.value = 'BATCH-GROUP-ONLY';
    } else if (!elmSelf.value && !elmCase.value && elmF2f.value && !elmGroup.value) {
      elmMode.value = 'BATCH-F2F-ONLY';
    }
    //
    elmSpanMode.innerText = elmMode.value;
    //
    btnSubmit.disabled = formChanged() && canSubmit() ? false : true;
  }
  defineMode()
  //
  elmDate.addEventListener('change', defineMode);
  elmSelf.addEventListener('change', defineMode);
  elmCase.addEventListener('change', defineMode);
  elmF2f.addEventListener('change', defineMode);
  elmGroup.addEventListener('change', defineMode);
}())