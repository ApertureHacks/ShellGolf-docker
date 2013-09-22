$("#submit_code").click(function(btn){
  $btn = $(this);
  $commands_field = $("#commands");
  $stats_sidebar = $('#stats_sidebar');
  $sidebar_info = $('#sidebar_info');

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
        var strlen = commands.length;
        var cmds = (commands.split(";")).length + (commands.split("|")).length;
        $btn.removeClass("btn-info");
        $btn.addClass("btn-success");
        $stats_sidebar.text("Success");
        $sidebar_info.text("Number of chars: " + strlen +
                           "\nNumber of commands: " + cmds + "\nResult: Par");
      } else {
        $btn.removeClass("btn-info");
        $btn.addClass("btn-warning");
      }},
    error: function(xhr, status, error){
      console.log("AJAX ERROR: " + error.message);
    }
  });
});
