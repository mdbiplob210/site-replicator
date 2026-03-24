const phoneInputTagMatcher = /<input\b[^>]*>/gi;

function isPhoneLikeInputTag(tag: string) {
  return (
    /(?:name|id|placeholder|autocomplete)\s*=\s*(['"])[^'"]*(customer_phone|phone|mobile|customer_mobile|contact_number|মোবাইল|ফোন|tel)[^'"]*\1/i.test(tag) ||
    /type\s*=\s*(['"])tel\1/i.test(tag) ||
    /inputmode\s*=\s*(['"])tel\1/i.test(tag)
  );
}

export function normalizeLandingPhoneHtml(html: string) {
  let normalized = html
    .replace(/maxlength\s*=\s*(['"])\s*(?:10|11|12|13|14)\s*\1/gi, 'maxlength="15"')
    .replace(/\.slice\(\s*0\s*,\s*11\s*\)/gi, '.slice(0,15)')
    .replace(/\.substring\(\s*0\s*,\s*11\s*\)/gi, '.substring(0,15)')
    .replace(/\.substr\(\s*0\s*,\s*11\s*\)/gi, '.substr(0,15)');

  normalized = normalized.replace(phoneInputTagMatcher, (tag) => {
    if (!isPhoneLikeInputTag(tag)) return tag;

    let nextTag = tag
      .replace(/\spattern\s*=\s*(['"])[^'"]*\1/gi, '')
      .replace(/\smaxlength\s*=\s*(['"])\d+\1/gi, ' maxlength="15"')
      .replace(/\sinputmode\s*=\s*(['"])[^'"]*\1/gi, ' inputmode="tel"')
      .replace(/\stype\s*=\s*(['"])number\1/gi, ' type="tel"');

    if (!/\smaxlength\s*=\s*/i.test(nextTag)) {
      nextTag = nextTag.replace(/<input/i, '<input maxlength="15"');
    }

    if (!/\sinputmode\s*=\s*/i.test(nextTag)) {
      nextTag = nextTag.replace(/<input/i, '<input inputmode="tel"');
    }

    return nextTag;
  });

  return normalized;
}

export const landingPhoneValidationScript = `
<script>
(function(){
  var PHONE_INPUT_SELECTOR = 'input[name="customer_phone"],input[name="phone"],input[name="mobile"],input[name="customer_mobile"],input[name="contact_number"],input[type="tel"],input[inputmode="tel"],input[autocomplete="tel"],input[id*="phone" i],input[id*="mobile" i],input[placeholder*="মোবাইল"],input[placeholder*="ফোন"],input[placeholder*="phone" i],input[placeholder*="mobile" i]';
  var bengaliMap = {'০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9'};

  function sanitizePhone(val) {
    var result = '';
    for (var i = 0; i < val.length; i++) {
      var ch = val[i];
      if (bengaliMap[ch]) result += bengaliMap[ch];
      else if (/[0-9]/.test(ch)) result += ch;
      else if (ch === '+' && result.length === 0) result += ch;
    }
    return result;
  }

  function isValidPhone(phone) {
    var cleaned = (phone || '').replace(/^\\+?880/, '0').replace(/[^0-9]/g, '');
    return /^\d{11,15}$/.test(cleaned);
  }

  function isPhoneElement(el) {
    if (!el || el.tagName !== 'INPUT') return false;
    var type = (el.getAttribute('type') || '').toLowerCase();
    var name = (el.getAttribute('name') || '').toLowerCase();
    var id = (el.getAttribute('id') || '').toLowerCase();
    var placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
    var autocomplete = (el.getAttribute('autocomplete') || '').toLowerCase();
    var inputmode = (el.getAttribute('inputmode') || '').toLowerCase();
    return type === 'tel' || inputmode === 'tel' || autocomplete === 'tel' || /customer_phone|phone|mobile|customer_mobile|contact_number/.test(name) || /phone|mobile/.test(id) || /phone|mobile|মোবাইল|ফোন/.test(placeholder);
  }

  function patchInlineHandler(input) {
    var inline = input.getAttribute('oninput');
    if (!inline) return;
    var patched = inline
      .replace(/\.slice\(\s*0\s*,\s*11\s*\)/ig, '.slice(0,15)')
      .replace(/\.substring\(\s*0\s*,\s*11\s*\)/ig, '.substring(0,15)')
      .replace(/\.substr\(\s*0\s*,\s*11\s*\)/ig, '.substr(0,15)');
    if (patched !== inline) input.setAttribute('oninput', patched);
  }

  function patchPhoneInput(input) {
    if (!isPhoneElement(input)) return;
    input.setAttribute('maxlength', '15');
    input.setAttribute('inputmode', 'tel');
    if (input.getAttribute('pattern')) input.removeAttribute('pattern');
    if ((input.getAttribute('type') || '').toLowerCase() === 'number') {
      try { input.setAttribute('type', 'tel'); } catch (e) {}
    }
    patchInlineHandler(input);
  }

  function patchAll(root) {
    if (!root) return;
    if (root.nodeType === 1 && isPhoneElement(root)) patchPhoneInput(root);
    if (!root.querySelectorAll) return;
    var inputs = root.querySelectorAll(PHONE_INPUT_SELECTOR);
    for (var i = 0; i < inputs.length; i++) patchPhoneInput(inputs[i]);
  }

  document.addEventListener('input', function(e) {
    if (!isPhoneElement(e.target)) return;
    patchPhoneInput(e.target);
    var sanitized = sanitizePhone(e.target.value || '');
    if (sanitized.length > 15) sanitized = sanitized.slice(0, 15);
    if (e.target.value !== sanitized) e.target.value = sanitized;
  }, true);

  document.addEventListener('submit', function(e) {
    var form = e.target && e.target.closest ? e.target.closest('[data-checkout-form], form, #checkoutForm, #orderForm, .checkout-form, .order-form') : null;
    if (!form) return;
    patchAll(form);
    var phoneInput = form.querySelector(PHONE_INPUT_SELECTOR);
    if (phoneInput && !isValidPhone(phoneInput.value)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      alert('অনুগ্রহ করে সঠিক মোবাইল নম্বর দিন (কমপক্ষে ১১ সংখ্যা)');
      phoneInput.focus();
      return false;
    }
  }, true);

  var runPatch = function() {
    patchAll(document);
    setTimeout(function(){ patchAll(document); }, 200);
    setTimeout(function(){ patchAll(document); }, 1000);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', runPatch);
  else runPatch();

  if (typeof MutationObserver !== 'undefined' && document.documentElement) {
    new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var mutation = mutations[i];
        if (mutation.type === 'attributes' && isPhoneElement(mutation.target)) patchPhoneInput(mutation.target);
        for (var j = 0; j < mutation.addedNodes.length; j++) patchAll(mutation.addedNodes[j]);
      }
    }).observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['type', 'name', 'id', 'placeholder', 'maxlength', 'pattern', 'inputmode', 'oninput']
    });
  }
})();
</script>`;