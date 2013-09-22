$("#submit_code").click(function(btn){
  $btn = $(this);
  $commands_field = $("#commands");

  $btn.removeClass("btn-default");
  $btn.addClass("btn-info");

  commands = $commands_field.val();
  $.ajax({
    type: 'POST',
    url: window.location.pathname + "/submit",
    data: { commands: commands },
    success: function(data){
      console.log(data);
      data = JSON.parse(data);
      if (data.success) {
        $btn.removeClass("btn-info");
        $btn.addClass("btn-success");
      } else {
        $btn.removeClass("btn-info");
        $btn.addClass("btn-warning");
      }},
    error: function(xhr, status, error){
      console.log("AJAX ERROR: " + error.message);
    }
  });
});
