let currentSlot = null;
let currentGroupId = null;

// SSE assessorChanged
document.body.addEventListener("assessorChanged", function (event) {
  // deselect radios, hide assessor's tray
  // console.log("assessorChanged")
  document.querySelector("#fake-radio").click();
  // document.querySelector("#df-assessors").style.display = "none";
  enableGroupRefreshButton(false);
});

// SSE GROUPS_REFRESHED
document.body.addEventListener("GROUPS_REFRESHED", function (event) {
  console.log("GROUPS_REFRESHED")
  document.querySelector("#fake-radio").click();
  document.querySelector("#df-assessors").style.display = "none";
  setTimeout(_activate, 200);
});

// Radio <input type="radio" id="radio-1103-01" value="1103-01" slot="s4" current_ass_id="2">
// Input <input type="text" radio="radio-1103-01" id="div-1103-01" value="Wanda Jati">

const _activate = () => {
  document.querySelectorAll(".ag-radio").forEach((radio) => {
    radio.removeAttribute("disabled");
    radio.addEventListener("change", function (event){
      const _radio = event.target;
      if (event.target.checked) {
        if (event.target.id == "fake-radio") return; // faker
        // Save values
        currentSlot = _radio.getAttribute("slot");
        currentGroupId = _radio.value;
        // Clear .off
        // document.querySelectorAll('.ass-names').forEach(e => e.classList.remove('off'));
        // Mark .off for assessors having task on current slot
        document.querySelectorAll('.ass-names').forEach(elm => {
          elm.classList.remove('off');
          if (elm.getAttribute(currentSlot).length > 0) {
            elm.classList.add('off')
          }
        });
        // Show tray
        document.querySelector("#df-assessors").style.display = "block";
      } else {
        //
      }
    })
  })
}
_activate();

document.querySelectorAll(".ass-names").forEach((elm) => {
  elm.addEventListener("click", function (event) {
    // Handle .off
    if (event.target.classList.contains('off')) return false;
    //
    const checkedRadio = document.querySelector("[name=group_id]:checked");
    if (checkedRadio) {
      // Remove slot attr for prev holder, if any
      const prev = document.querySelector(`[${currentSlot}="${currentGroupId}"]`);
      if (prev) prev.setAttribute(currentSlot, "");

      const radio = event.target;
      // display
      const input1 = document.querySelector("#lgd_ass_id-" + checkedRadio.value);
      input1.value = event.target.getAttribute("ass_id");
      const input2 = document.querySelector("#name-" + checkedRadio.value);
      input2.value = radio.innerHTML;
      // enable button
      input2.nextSibling.removeAttribute("disabled");
      input2.nextSibling.classList.add('dirty');
      radio.setAttribute(currentSlot, currentGroupId);
      enableGroupRefreshButton(true);
    }
  });
});

const activateRadios = () => {
  document.querySelectorAll("[name=group_id]").forEach((elm) => {
    // The radios are disabled by default
    elm.removeAttribute("disabled");
    elm.addEventListener("change", function (event) {
      console.log("RADIO CLICKED");
      if (event.target.checked) {
        // handle faker
        if (event.target.id == "fake-radio") return;

        currentSlot = event.target.getAttribute("slot");
        currentGroupId = event.target.value;

        // Unmark .off
        document.querySelectorAll('.ass-names').forEach(e => e.classList.remove('off'))

        // Mark .off for assessors having task on current slot
        document.querySelectorAll('.ass-names').forEach(elm => {
          if (elm.getAttribute(currentSlot).length > 0) {
            elm.classList.add('off')
          }
        })

        // Show tray
        document.querySelector("#df-assessors").style.display = "block";
      }
    });
  });
}

const undoGroupChanges = () => {
  return; // BUGGY

  // hidden input
  document.querySelectorAll(".input-lgd-ass-id").forEach((input) => {
    input.value = input.getAttribute("_value");
  })

  const oldVals = [];
  // name input
  document.querySelectorAll(".ag-input").forEach((input) => {
    input.value = input.getAttribute("_value");
    const ass_id = input.getAttribute("ass_id");
    console.log("ass_id", ass_id)
    const group_id = input.getAttribute("group_id");
    const slot = input.getAttribute("slot");
    // const oldVals = [];
    if (ass_id) oldVals.push({ id: ass_id, group_id, slot });

  })
  // names
  document.querySelectorAll('.ass-names').forEach(elm => {
    elm.classList.remove('off');
    elm.setAttribute("s1", "");
    elm.setAttribute("s2", "");
    elm.setAttribute("s3", "");
    elm.setAttribute("s4", "");
    const id = elm.getAttribute("ass_id")
    // console.log("id", id)
    oldVals.forEach(val => {
      if (val.id == id) {
        console.log(val)
        if (val.slot == "1") elm.setAttribute("s1", val.group_id);
        if (val.slot == "2") elm.setAttribute("s2", val.group_id);
        if (val.slot == "3") elm.setAttribute("s3", val.group_id);
        if (val.slot == "4") elm.setAttribute("s4", val.group_id);
      }
    })
  });
  enableGroupRefreshButton(false)
  document.getElementById("fake-radio").click()
}



// activateRadios();
const enableGroupRefreshButton = (v=true) => {
  const btn = document.getElementById('btn-group-refresh');
  if (v) {
    btn.removeAttribute("disabled");
    btn.style.opacity = 1;
  } else {
    btn.setAttribute("disabled", true);
    btn.style.opacity = 0.5;
  }
}




function copyGroupAssessors() {
  const rs = [];
  document.querySelectorAll('.ass-names').forEach((el) => {
    const o = {
      id: el.getAttribute("ass_id"),
      fullname: el.innerText,
      off: el.classList.contains('off'),
      s1: null, s2: null, s3: null, s4: null,
    }
    rs.push(o)
  });
  return rs;
}

function deleteParent(event) {
  // const parent = event.target.parentElement;
  // document.getElementById(parent.getAttribute('ass_id')).click();
  const parent = event.target.parentElement;
  const id = parent.getAttribute("ass_id");
  AG = AG.filter((x) => x != id);
  const ref = document.getElementById("f2f-ass-" + id);
  parent.remove();
  ref.classList.remove("hidden");
  document.getElementById("AGLENGTH").innerText = AG.length
  document.getElementById("f2f-ass-id-list").value = AG.join(" ");

  const btn = document.getElementById("btn-f2f-ass")
  if (AG.length == 9) {
    btn.removeAttribute("disabled")
  } else {
    btn.setAttribute("disabled", true)
  }
}

// F2F assessor item
function selectAssessor(id,name) {
  return `<div ass_id="${id}" style="position:relative;">
    <input type="text" style="width:100%;" value="${name}" />
    <button
      onclick="deleteParent(event)"
      class="delete-item">
      X
    </button>
  </div>`;
}

// WAITING FOR ACES_ASTRAY HAS BEEN LOADED
// if (ACES_ASTRAY == undefined) console.log("ACES_ASTRAY undefined")

// expert's tray
let AG = [];
// let AGMAX = ${maxgroup};
const AGSPAN = document.querySelector("#AGSPAN");
const AGLENGTH = document.querySelector("#AGLENGTH");

function selectF2FAssessor(event) {
  if (AG.length == AGMAX) return;
  const p = event.target;
  const id = p.id.split("-")[2];
  const name = p.innerText;
  const tray = document.getElementById("f2f-asstray");
  AG.push(id);
  const btn = document.getElementById("btn-f2f-ass")
  if (AG.length == 9) {
    btn.removeAttribute("disabled")
  } else {
    btn.setAttribute("disabled", true)
  }
  tray.innerHTML += selectAssessor(id, name);
  p.classList.add("hidden");
  document.getElementById("AGLENGTH").innerText = AG.length
  document.getElementById("f2f-ass-id-list").value = AG.join(" ");
}

document.querySelectorAll(".f2f-ass-item").forEach((p) => {
  p.addEventListener("click", selectF2FAssessor)
})

function toggleF2FBucket() {
  const div = document.getElementById("f2f-ass-bucket");
  if (div.style.display == "none") div.style.display = "block"
  else div.style.display = "none"
}

function cb(event) {
  const v = event.target.value;
  const tray = document.getElementById("f2f-asstray");
  if (event.target.checked) {
    if (AG.length == AGMAX) {
      event.target.checked = false;
    } else {
      AG.push(v);
      event.target.removeAttribute("marked");
      const name = event.target.nextSibling.innerText;
      tray.innerHTML += selectAssessor(v, name)
    }
  } else {
    AG = AG.filter((x) => x != v);
    event.target.setAttribute("marked", true);
    // remove item from tray
    document.querySelector('[ass_id="ass-'+v+'"]').remove();
  }

  AGSPAN.innerText = AG.join(", ");
  AGLENGTH.innerText = AG.length;
  if (AG.length == AGMAX) {
    document.querySelectorAll("[marked]").forEach((el) => {
      el.setAttribute("disabled", true);
      el.nextSibling.style.color = "#ccc";
    });
  } else {
    document.querySelectorAll("[marked]").forEach((el) => {
      el.removeAttribute("disabled");
      el.nextSibling.style.color = "rgb(51, 65, 85)";
    });
  }
}
