$("#submit_code").click(function(btn){
  $btn = $(this);
  $commands_field = $("#commands");

  $btn.removeClass("btn-default");
  $btn.addClass("btn-info");

  commands = $commands_field.val();
  $.ajax(
    window.location.pathname + "/submit",
    {
      data: { user_id: $("#user_id").val(),
              commands: commands
      },
      success: function(result){
        $btn.removeClass("btn-info");
        $btn.addClass("btn-success");
      },
      failure: function(result){
        $btn.removeClass("btn-info");
        $btn.addClass("btn-warning");
      },
      timeout: 240
  });
});
