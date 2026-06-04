<?php
// Simple redirect page to simulate provider payment completion
$txId = $_GET['txId'] ?? '';
if (!$txId) { echo 'Missing txId'; exit; }

// Show a page with a button to 'simulate pay' which calls webhook to mark paid
?>
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Simulate Payment</title></head><body>
  <h2>Simulate Payment for <?php echo htmlspecialchars($txId); ?></h2>
  <p>Click to mark this payment as <strong>paid</strong> (this simulates the PSP webhook).</p>
  <button id="payBtn">Simulate Pay</button>
  <script>
    document.getElementById('payBtn').addEventListener('click', ()=>{
      fetch('/api/payments/webhook.php', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ txId: '<?php echo addslashes($txId); ?>', status: 'paid' })
      }).then(r=>r.json()).then(j=>{ if (j.success) alert('Payment marked paid.'); else alert('Failed'); }).catch(e=>alert('Error'));
    });
  </script>
</body></html>