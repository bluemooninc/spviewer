
(function () {

// SP Viewer
// 
// Released under the MIT license by SAWATARI Mikage
// http://www.mikage.to/radiation/spviewer/
// 

$(document).ready(function() {
	spviewer_init();
});


var nuclear_data = [];
var range_preset = [];

var plot;
var placeholder;
var range_select_mode;
var range_selectd;
var range_selectd_left;
var range_selectd_right;

var sp_info_html;
var sp_cursor_info_html;
var sp_cursor_info_compare_html;
var sp_cursor_info_multi_html;
var sp_cursor_nuclear_html;
var sp_cursor_selection_html;
var sp_cursor_selection_compare_html;
var sp_cursor_selection_multi_html;

function spviewer_init() {
	
	sp_info_html = $("#sp_info").html();
	sp_cursor_info_html = $("#sp_cursor_info").html();
	sp_cursor_info_compare_html = $("#sp_cursor_info_compare").html();
	sp_cursor_info_multi_html = $("#sp_cursor_info_multi").html();
	sp_cursor_nuclear_html = $("#sp_cursor_nuclear").html();
	sp_cursor_selection_html = $("#sp_cursor_selection").html();
	sp_cursor_selection_compare_html = $("#sp_cursor_selection_compare").html();
	sp_cursor_selection_multi_html = $("#sp_cursor_selection_multi").html();
	
	placeholder = $("#sp_graph");
	
	clear_html();
	
	load_nuclear_data();
	
};

function clear_html() {
	
	placeholder.unbind("plotselected");
	placeholder.unbind("plothover");
	range_select_mode = 'center';
	range_selectd = undefined;
	range_selectd_left = undefined;
	range_selectd_right = undefined;
	
	$("#sp_cursor_info").hide();
	$("#sp_cursor_info_compare").hide();
	$("#sp_cursor_info_multi").hide();
	$("#sp_cursor_nuclear").hide();
	$("#sp_cursor_selection").hide();
	$("#sp_cursor_selection_compare").hide();
	$("#sp_cursor_selection_multi").hide();
	$("#bg_range_selector").hide();
	$("#bg_range_selector_manual").hide();
	$("#save_tsv").hide();
	
	$("#sp_sel").html('');
	$("#sp_info").html(sp_info_html);
	$("#sp_graph").html('');
	$("#sp_cursor_info").html(sp_cursor_info_html);
	$("#sp_cursor_info_compare").html(sp_cursor_info_compare_html);
	$("#sp_cursor_info_multi").html(sp_cursor_info_multi_html);
	$("#sp_cursor_nuclear").html(sp_cursor_nuclear_html);
	$("#sp_cursor_selection").html(sp_cursor_selection_html);
	$("#sp_cursor_selection_compare").html(sp_cursor_selection_compare_html);
	$("#sp_cursor_selection_multi").html(sp_cursor_selection_multi_html);
	$("#tsv_data").html('');
}

function load_nuclear_data() {
	$.ajax({
		cache: false,
		dataType: "text",
		url: "nuclear_data.txt",
		error: function(jqXHR, textStatus, errorThrown) {
			alert("can't get nuclear_data.txt. " + textStatus + ":" + errorThrown);
		},
		success: function(data, textStatus, jqXHR) {
			init_nuclear_data(data);
			load_range_preset_data();
		}
	});
	
}

function init_nuclear_data(data) {
	var nuclear = split_line(data);
	
	for(var i in nuclear) {
		if(nuclear[i] != "") {
			var field = nuclear[i].split("\t");
			// エネルギー，核種，半減期，放出比
			// エネルギーは数値になおしておく．
			field[0] = parseFloat(field[0]);
			nuclear_data.push(field);
		}
	}
}

function load_range_preset_data() {
	$.ajax({
		cache: false,
		dataType: "text",
		url: "range_preset.txt",
		error: function(jqXHR, textStatus, errorThrown) {
			alert("can't get range_preset.txt. " + textStatus + ":" + errorThrown);
		},
		success: function(data, textStatus, jqXHR) {
			init_range_preset_data(data);
			load_list();
		}
	});
	
}

function init_range_preset_data(data) {
	var range_preset_line = split_line(data);
	for(var i in range_preset_line) {
		if(range_preset_line[i] != "") {
			var field = range_preset_line[i].split(",");
			// 範囲名(核種)，中心エネルギー，L側%，H側%
			field[1] = parseFloat(field[1]);
			range_preset.push(field);
		}
	}
}

function load_list() {
	$.ajax({
		cache: false,
		dataType: "text",
		url: "spviewer_list.txt",
		error: function(jqXHR, textStatus, errorThrown) {
			alert("can't get spviewer_list.txt. " + textStatus + ":" + errorThrown);
		},
		success: function(data, textStatus, jqXHR) {
			var files = split_line(data);
			if(document.location.hash.match(/^#3__(.*)/)) {
				init_list_multi(files);
			} else if(document.location.hash.match(/^#2__(.*)/)) {
				init_list_compare(files);
			} else {
				init_list(files);
			}
			check_autoload(files);
		}
	});
}

function check_autoload(files) {
	if(document.location.hash.match(/^#__(.*)/)) {
		var hashstr = RegExp.$1.split("//");
		var loadfile = decodeURIComponent(hashstr[0]);
		draw_file(files, loadfile);
	}
	if(document.location.hash.match(/^#2__(.*)/)) {
		var hashstr = RegExp.$1.split("//");
		var loadfiles = hashstr[0].split("/");
		var loadfile = [
			decodeURIComponent(loadfiles[0]),
			decodeURIComponent(loadfiles[1])
		];
		draw_file_compare(files, loadfile);
	}
	if(document.location.hash.match(/^#3__(.*)/)) {
		var hashstr = RegExp.$1.split("//");
		var loadfiles = hashstr[0].split("/");
		var loadfile = [];
		for(var i = 0; i < loadfiles.length; i++) {
			loadfile.push(decodeURIComponent(loadfiles[i]));
		}
		draw_file_multi(files, loadfile);
	}
}

function init_list(files) {
	
	var loadfile = '';
	if(document.location.hash.match(/^#__(.*)/)) {
		var hashstr = RegExp.$1.split("//");
		loadfile = decodeURIComponent(hashstr[0]);
	}
	
	var html = '';
	
	html += '[スペクトル表示][<a href="#" id="compare_list">BGスペクトル比較（Ｂ－Ａ）</a>][<a href="#" id="multi_list">複数スペクトル比較</a>]';
	
	html += '<table class="csv">';
	html += '<tr><th>－</th><th>スペクトルファイル</th></tr>';
	for(var i in files) {
		if(files[i] != "") {
			files[i].match(/^([^,]+),?(.+)?/);
			var field = [ RegExp.$1, RegExp.$2 ];
			html += '<tr><td>';
			var checked = (loadfile == field[0]) ? ' checked' : '';
			html += '<input type="radio" name="file" value="' + field[0] + '" ' + checked + '>';
			html += '</td><td>';
			html += '[<a href="' + field[0] + '">DL</a>] ';
			html += field[1];
			html += '</td></tr>';
		}
	}
	html += '</table>';
	$("#file_select").html(html);
	$("#file_select input").bind('change', function() {
		var file = $(this).val();
		draw_file(files, file)
	});
	
	$("#compare_list").bind('click', function() {
		init_list_compare(files);
		return false;
	});
	$("#multi_list").bind('click', function() {
		init_list_multi(files);
		return false;
	});
	
}

function init_list_compare(files) {
	
	var loadfile = ['', ''];
	if(document.location.hash.match(/^#2__(.*)/)) {
		var hashstr = RegExp.$1.split("//");
		var file = hashstr[0].split("/");
		loadfile = [
			decodeURIComponent(file[0]),
			decodeURIComponent(file[1])
		];
	}
	
	var html = '';
	
	html += '[<a href="#" id="list">スペクトル表示</a>][BGスペクトル比較（Ｂ－Ａ）][<a href="#" id="multi_list">複数スペクトル比較</a>]';
	
	html += '<table class="csv">';
	html += '<tr><th>Ａ(BG)</th><th>Ｂ</th><th>スペクトルファイル</th></tr>';
	for(var i in files) {
		if(files[i] != "") {
			files[i].match(/^([^,]+),?(.+)?/);
			var field = [ RegExp.$1, RegExp.$2 ];
			html += '<tr><td>';
			var checked;
			checked = (loadfile[0] == field[0]) ? ' checked' : '';
			html += '<input type="radio" name="file1" value="' + field[0] + '" ' + checked + '>';
			html += '</td><td>';
			checked = (loadfile[1] == field[0]) ? ' checked' : '';
			html += '<input type="radio" name="file2" value="' + field[0] + '" ' + checked + '>';
			html += '</td><td>';
			html += field[1];
			html += '</td></tr>';
		}
	}
	html += '</table>';
	$("#file_select").html(html);
	$("#file_select input").bind('change', function() {
		var file1 = $("input[name='file1']:checked").val();
		var file2 = $("input[name='file2']:checked").val();
		if(file1 && file2)
		draw_file_compare(files, [file1, file2]);
	});
	
	$("#list").bind('click', function() {
		init_list(files);
		return false;
	});
	$("#multi_list").bind('click', function() {
		init_list_multi(files);
		return false;
	});
	
}

function init_list_multi(files) {
	
	var loadfile = [];
	if(document.location.hash.match(/^#3__(.*)/)) {
		var hashstr = RegExp.$1.split("//");
		var file = hashstr[0].split("/");
		for(var i = 0; i < file.length; i++) {
			loadfile.push(decodeURIComponent(file[i]));
		}
	}
	
	var html = '';
	
	html += '[<a href="#" id="list">スペクトル表示</a>][<a href="#" id="compare_list">BGスペクトル比較（Ｂ－Ａ）</a>][複数スペクトル比較]';
	
	html += '<table class="csv">';
	html += '<tr><th>－</th><th>スペクトルファイル</th></tr>';
	for(var i in files) {
		if(files[i] != "") {
			files[i].match(/^([^,]+),?(.+)?/);
			var field = [ RegExp.$1, RegExp.$2 ];
			html += '<tr><td>';
			var checked = '';
			for(var l = 0; l < loadfile.length; l++) {
				if(loadfile[l] == field[0])
					checked = ' checked';
			}
			html += '<input type="checkbox" name="file" value="' + field[0] + '" ' + checked + '>';
			html += '</td><td>';
			html += '[<a href="' + field[0] + '">DL</a>] ';
			html += field[1];
			html += '</td></tr>';
		}
	}
	html += '</table>';
	html += '<form>';
	html += '<input type="button" value="スペクトル表示">';
	html += '</form>';
	$("#file_select").html(html);
	$("#file_select input[type='button']").bind('click', function() {
		var file = [];
		$("input[name='file']:checked").each(function(i, filename) {
			file.push($(this).val());
		});
		if(file.length > 0) {
			if(file.length > 5) {
				alert("同時に表示できるスペクトルは5つまでです。");
			} else {
				draw_file_multi(files, file);
			}
		}
	});
	
	$("#list").bind('click', function() {
		init_list(files);
		return false;
	});
	$("#compare_list").bind('click', function() {
		init_list_compare(files);
		return false;
	});
	
}


function draw_file(files, file) {
	
	// ファイル一覧になければAjax要求してはいけない
	var exists;
	var load_file_comment;
	for(var i in files) {
		if(files[i] != "") {
			files[i].match(/^([^,]+),?(.+)?/);
			var field = [ RegExp.$1, RegExp.$2 ];
			if(field[0] == file) {
				exists = 1;
				load_file_comment = field[1];
				break;
			}
		}
	}
	if(!exists) {
		alert("Can't load " + file + ". ");
		return;
	}
	
	$.ajax({
		cache: false,
		dataType: "text",
		url: file,
		beforeSend: function(xhr) {
			xhr.overrideMimeType("text/html; charset=UTF-8");
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert("can't get " + file + ". " + textStatus + ":" + errorThrown);
		},
		success: function(data, textStatus, jqXHR) {
			var spectrum = parse_file(file, load_file_comment, data);
			if(spectrum) {
				draw_graph(spectrum);
			} else {
				alert("Unknown format.");
			}
		}
	});
}

function draw_file_compare(files, file) {
	
	// ファイル一覧になければAjax要求してはいけない
	var exists = 0;
	var load_file_comment = [];
	for(var i in files) {
		if(files[i] != "") {
			files[i].match(/^([^,]+),?(.+)?/);
			var field = [ RegExp.$1, RegExp.$2 ];
			if(field[0] == file[0]) {
				exists++;
				load_file_comment[0] = field[1];
			}
			if(field[0] == file[1]) {
				exists++;
				load_file_comment[1] = field[1];
			}
		}
	}
	if(exists != 2) {
		alert("Can't load " + file[0] + " / " + file[1] + ". ");
		return;
	}
	
	$.ajax({
		cache: false,
		dataType: "text",
		url: file[0],
		beforeSend: function(xhr) {
			xhr.overrideMimeType("text/html; charset=UTF-8");
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert("can't get " + file[0] + ". " + textStatus + ":" + errorThrown);
		},
		success: function(data1, textStatus, jqXHR) {
			var spectrum1 = parse_file(file[0], load_file_comment[0], data1);
			if(spectrum1) {
				draw_file_compare2(files, file, load_file_comment[1], spectrum1);
			} else {
				alert("Unknown format.");
			}
		}
	});
}

function draw_file_compare2(files, file, load_file_comment, spectrum1) {
	$.ajax({
		cache: false,
		dataType: "text",
		url: file[1],
		beforeSend: function(xhr) {
			xhr.overrideMimeType("text/html; charset=UTF-8");
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert("can't get " + file[1] + ". " + textStatus + ":" + errorThrown);
		},
		success: function(data2, textStatus, jqXHR) {
			var spectrum2 = parse_file(file[1], load_file_comment, data2);
			if(spectrum2) {
				draw_graph_compare([spectrum1, spectrum2]);
			} else {
				alert("Unknown format.");
			}
		}
	});
}

function draw_file_multi(files, file) {
	
	// ファイル一覧になければAjax要求してはいけない
	var load_file_comment = [];
	for(var i in file) {
		var exists = 0;
		for(var j in files) {
			if(files[j] != "") {
				files[j].match(/^([^,]+),?(.+)?/);
				var field = [ RegExp.$1, RegExp.$2 ];
				if(field[0] == file[i]) {
					exists++;
					load_file_comment[i] = field[1];
				}
			}
		}
		if(exists == 0) {
			alert("Can't load " + file[i] + ". ");
			return;
		}
	}
	
	draw_file_multi2(files, file, load_file_comment, 0, []);
	
}

function draw_file_multi2(files, file, load_file_comment, fileno, spectrum) {
	$.ajax({
		cache: false,
		dataType: "text",
		url: file[fileno],
		beforeSend: function(xhr) {
			xhr.overrideMimeType("text/html; charset=UTF-8");
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert("can't get " + file[fileno] + ". " + textStatus + ":" + errorThrown);
		},
		success: function(data2, textStatus, jqXHR) {
			var add_spectrum = parse_file(file[fileno], load_file_comment[fileno], data2);
			spectrum.push(add_spectrum);
			if(add_spectrum) {
				if(fileno < file.length-1) {
					draw_file_multi2(files, file, load_file_comment, fileno+1, spectrum);
				} else {
					draw_graph_multi(spectrum);
				}
			} else {
				alert("Unknown format.");
			}
		}
	});
}

function parse_file(file, file_comment, data) {
	
	var instruments = [
		draw_graph_xml_spectrum,
		draw_graph_bqmon_spectrum,
		draw_graph_ts100b_bq,
		draw_graph_ts100b_spectrum,
		draw_graph_spe_spectrum,
		draw_graph_pra_spectrum,
		draw_graph_wintmca_spectrum,
		draw_graph_ts100_spectrum,
		draw_graph_ta100_spectrum,
		draw_graph_tn300b_spectrum,
		draw_graph_tn300b_2_spectrum,
		draw_graph_fnf401_spectrum,
		draw_graph_emf211_spectrum,
		draw_graph_emf211b_spectrum,
		draw_graph_at1320_spectrum,
		draw_graph_lb2045_spectrum,
		draw_graph_canberra_gc2020_spectrum,
		draw_graph_a2700_spectrum,
		draw_graph_csk2i_spectrum,
		draw_graph_csk3ix_spectrum
	];
	
	for(var i in instruments) {
		var spectrum = instruments[i](file, file_comment, data);
		if(spectrum) {
			return spectrum;
		}
	}
	
	return false;
}

function draw_graph(spectrum) {
	
	clear_html();
	
	$("#sp_cursor_info").show();
	$("#sp_cursor_nuclear").show();
	$("#sp_cursor_selection").show();
	$("#bg_range_selector").show();
	$("#save_tsv").show();
	
	draw_graph_common(spectrum);
}

function draw_graph_compare(spectrums) {
	
	clear_html();
	
	$("#sp_cursor_info_compare").show();
	$("#sp_cursor_nuclear").show();
	$("#sp_cursor_selection_compare").show();
	
	if(spectrums.length == 2) {
		draw_graph_common_compare(spectrums);
		return;
	}
}

function draw_graph_multi(spectrums) {
	
	clear_html();
	
	$("#sp_cursor_info_multi").show();
	$("#sp_cursor_nuclear").show();
	$("#sp_cursor_selection_multi").show();
	
	if(spectrums.length > 0) {
		draw_graph_common_multi(spectrums);
		return;
	}
}

function sp_info_gps(file_comment) {
	var sp_info = [];
	if(file_comment.match(/\[gps:([0-9\.]+),([0-9\.]+)\]/)) {
		var gpslink = '<a href="http://maps.google.co.jp/maps?q='
			+ RegExp.$1 + ',' + RegExp.$2
			+ '&z=18&t=h'
			+ '" target="_blank">位置をGoogleMapで表示</a><br>'
			+ '(LATT:' + RegExp.$1
			+ ', LONG:' + RegExp.$2
			+ ')';
		sp_info.push(["位置情報", gpslink]);
	}
	return sp_info;
}

function draw_graph_ts100b_bq(file, file_comment, data) {
	// フォーマットのチェック
	if(data.match(/^START TIME,.*\r?\nMEASURE TIME,.*\r?\nSAMPLE WEIGHT,.*\r?\na,.*\r?\n\r?\n/)) {
		// TS100B Becquerelモード
	} else {
		return false;
	}
	
	var lines = split_line(data);
	
	var additional_sp_info_html = '';
	var additional_sp_info = [];
	
	additional_sp_info_html += '<table class="csv">';
	additional_sp_info_html += '<tr><th>NUCLUIDE</th><th>ACTIVITY(Bq/kg)</th><th>ERROR(Bq/kg)</th></tr>';
	
	var mode = "";
	for(var i in lines) {
		var line = lines[i];
		if(line == "") {
			mode = "";
			continue;
		}
		if(line.match(/^SAMPLE WEIGHT,([0-9\.]+),(.*)$/)) {
			additional_sp_info.push(["試料重量", RegExp.$1 + " " + RegExp.$2]);
		}
		if(line.match(/^ND. THRESHOLD,(.*)$/)) {
			additional_sp_info.push(["検出限界設定", RegExp.$1]);
		}
		if(mode == "" && line.match(/^NUCLUIDE,ACTIVITY\(Bq\/(kg|L)\),ERROR\(Bq\/(kg|L)\)$/)) {
			mode = "NUCLUIDE";
			continue;
		}
		if(mode == "NUCLUIDE") {
			var fields = line.split(",");
			if(fields.length == 3) {
				additional_sp_info_html += '<tr id="isotope_' + fields[0] + '"><th>' + fields[0]
					+ '</th><td style="text-align: right;">' + fields[1]
					+ '</td><td style="text-align: right;">' + fields[2] + '</td></tr>';
			} else if(fields.length == 2) {
				additional_sp_info_html += '<tr id="isotope_' + fields[0] + '"><th>' + fields[0]
					+ '</th><td style="text-align: right;" colspan="2">' + fields[1] + '</td></tr>';
			} else {
				alert("parse error");
				return false;
			}
		}
	}
	
	additional_sp_info_html += '</table>';
	
	var peak_info = {
		"I-131":  [[364, 20]],
		"Cs-134": [[569, 25], [605, 25], [796, 25]],
		"Cs-137": [[662, 25]],
		"K-40":   [[1461, 50]]
	};
	
	var additional_html_callback = function(slope) {
		for(var isotope in peak_info) {
			(function(i) {
				$("#isotope_" + i).bind('mouseenter', function() {
					$(this).css('background', '#ffdddd');
					
					graph_clear_marking();
					
					var markings = [];
					for(var n in peak_info[i]) {
						markings.push({
							color: '#ffdddd',
							xaxis: {
								from: draw_graph_common_ev2ch(slope, peak_info[i][n][0] - peak_info[i][n][1]),
								to: draw_graph_common_ev2ch(slope, peak_info[i][n][0] + peak_info[i][n][1])
							}
						});
					}
					
					var marking_option = {
						grid: {
							markings: markings
						}
					};
					draw_graph_common_update(marking_option);
				}).bind('mouseleave', function() {
					$(this).css('background', '');
					
					plot.clearSelection();
					graph_clear_marking();
				});
			})(isotope);
		}
	};
	
	
	return draw_graph_ts100b_common_spectrum(file, file_comment, data, additional_sp_info, additional_sp_info_html, additional_html_callback);
}

function draw_graph_ts100b_spectrum(file, file_comment, data) {
	// フォーマットのチェック
	if(data.match(/^START TIME,.*\r?\nMEASURE TIME,.*\r?\na,.*\r?\nID,.*\r?\n/)) {
		// TS100B Spectrumモード
	} else {
		return false;
	}
	
	var lines = split_line(data);
	
	var peak_info = [];
	
	var additional_sp_info_html = '';
	var additional_sp_info = [];
	
	additional_sp_info_html += '<table class="csv">';
	additional_sp_info_html += '<tr><th>ID</th><th>NUCLIDE</th><th>sROI(CH)</th><th>eROI(CH)</th><th>Center(CH)</th><th>Center(keV)</th>'
		+ '<th>NET(cnt)</th><th>NETRATE(cps)</th><th>GROSS(cnt)</th><th>GROSSRATE(cps)</th></tr>';
	
	var mode = "";
	for(var i in lines) {
		var line = lines[i];
		if(line == "") {
			mode = "";
			continue;
		}
		if(mode == "" && line.match(/^ID,NUCLIDE,sROI\(CH\),eROI\(CH\),Center\(CH\),Center\(keV\),NET\(cnt\),NETRATE\(cps\),GROSS\(cnt\),GROSSRATE\(cps\)$/)) {
			mode = "NUCLIDE";
			continue;
		}
		if(mode == "NUCLIDE") {
			var fields = line.split(",");
			if(fields.length == 11) {	// なぜか最後に余分な,があるので11フィールド
				additional_sp_info_html += '<tr id="isotope_' + fields[0] + '"><th>' + fields[0]
					+ '</th><th style="text-align: right;">' + fields[1]
					+ '</th><td style="text-align: right;">' + fields[2]
					+ '</td><td style="text-align: right;">' + fields[3]
					+ '</td><td style="text-align: right;">' + fields[4]
					+ '</td><td style="text-align: right;">' + fields[5]
					+ '</td><td style="text-align: right;">' + fields[6]
					+ '</td><td style="text-align: right;">' + fields[7]
					+ '</td><td style="text-align: right;">' + fields[8]
					+ '</td><td style="text-align: right;">' + fields[9]
					+ '</td></tr>';
				peak_info[fields[0]] = [fields[2], fields[3]];
			} else {
				alert("parse error");
				return false;
			}
		}
	}
	
	additional_sp_info_html += '</table>';
	
	
	var additional_html_callback = function(slope) {
		for(var isotope in peak_info) {
			(function(i) {
				$("#isotope_" + i).bind('mouseenter', function() {
					$(this).css('background', '#ffdddd');
					
					graph_clear_marking();
					
					var marking_option = {
						grid: {
							markings: [
								{
									color: '#ffdddd',
									xaxis: {
										from: peak_info[i][0],
										to: peak_info[i][1]
									}
								}
							]
						}
					};
					draw_graph_common_update(marking_option);
				}).bind('mouseleave', function() {
					$(this).css('background', '');
					
					plot.clearSelection();
					graph_clear_marking();
				});
			})(isotope);
		}
	};
	
	
	return draw_graph_ts100b_common_spectrum(file, file_comment, data, additional_sp_info, additional_sp_info_html, additional_html_callback);
}

function draw_graph_ts100b_common_spectrum(file, file_comment, data, additional_sp_info, additional_sp_info_html, additional_html_callback) {
	var lines = split_line(data);
	
	var slope;
	var spectrum_data_ch = [];
	var spectrum_data_ev = [];
	var time;
	var date_mea;
	
	
	for(var i in lines) {
		var line = lines[i];
		if(line == "") {
			continue;
		}
		if(line.match(/^MEASURE TIME,([0-9]+),sec$/)) {
			time = parseInt(RegExp.$1);
		}
		if(line.match(/^START TIME,([0-9\/ ]+),([0-9: ]+)$/)) {
			date_mea = RegExp.$1 + " " + RegExp.$2;
		}
		if(line.match(/^a,([^,]+),b,([^,]+)$/)) {
			slope = [parseFloat(RegExp.$1), parseFloat(RegExp.$2)];
		}
		if(line.match(/^a,([^,]+),b,([^,]+),c,([^,]+)$/)) {
			slope = [parseFloat(RegExp.$1), parseFloat(RegExp.$2), parseFloat(RegExp.$3)];
		}
		if(line.match(/^([0-9]+),([0-9]+)$/)) {
			var ch = RegExp.$1;
			var count = RegExp.$2;
			
			spectrum_data_ch.push([parseInt(ch), parseInt(count)]);
			spectrum_data_ev.push([draw_graph_common_ch2ev(slope, parseInt(ch)), parseInt(count)]);
		}
	}
	
	if(!time || !slope)
		return false;
	
	var min_count = find_min_count(spectrum_data_ch);
	
	var sp_info = sp_info_gps(file_comment);
	sp_info.push(["計測時間", format_time(time)]);
	
	var spectrum = {
		file: file,
		file_comment: file_comment,
		sp_info: sp_info,
		additional_sp_info_html: additional_sp_info_html,
		additional_html_callback: function() {
			additional_html_callback(slope)
		},
		time: time,
		min_cps: min_count / time,
		spectrum_data_ch: convert_count2cps(time, spectrum_data_ch),
		spectrum_data_ev: convert_count2cps(time, spectrum_data_ev)
	};
	if(date_mea) {
		spectrum['sp_info'].push(["計測時刻", date_mea]);
	}
	for(var i in additional_sp_info) {
		spectrum['sp_info'].push(additional_sp_info[i]);
	}
	return spectrum;
}

function draw_graph_common_ch2ev(slope, ch) {
	if(slope.length == 2) {
		return slope[0] * ch + slope[1];
	} else if(slope.length == 3) {
		return slope[0] * Math.pow(ch, 2) + slope[1] * ch + slope[2];
	}
}

function draw_graph_common_ev2ch(slope, ev) {
	if(slope.length == 2) {
		if(slope[0] == 0)
			return 0
		else
			return (ev - slope[1]) / slope[0];
	} else if(slope.length == 3) {
		if(slope[0] == 0) {
			return 0
		} else {
			if(slope[1] == 0)
				return (ev - slope[2]) / slope[1]
			else
				return (Math.sqrt(-4 * slope[0] * slope[2] + 4 * slope[0] * ev + Math.pow(slope[1], 2)) - slope[1]) / (2 * slope[0]);
		}
	}
}

function draw_graph_ts100_spectrum(file, file_comment, data) {
	// フォーマットのチェック
	if(data.match(/^\[SPECTRUM\]\r?\n.*\r?\n.*(MeV).*\r?\n.*\r?\n.*(MeV).*\r?\n.*\r?\n.*(CPS).*\r?\n.*\r?\n.*(CPS).*\r?\n\r?\n\r?\n/)) {
		// TA100 Spectrumモード
	} else {
		return false;
	}
	
	var lines = split_line(data);
	
	var time;
	if(data.match(/^\[SPECTRUM\]\r?\n測定時間\(秒\),([0-9]+)\r?\n/)) {
		time = parseInt(RegExp.$1);
	}
	
	var spectrum_data_ch = [];
	var spectrum_data_ev = [];
	
	for(var i in lines) {
		var line = lines[i];
		if(line == "") {
			continue;
		}
		if(line.match(/^([0-9]+),([0-9\.]+),([0-9]+)$/)) {
			var ch = RegExp.$1;
			var ev = RegExp.$2;
			var count = RegExp.$3;
			
			spectrum_data_ch.push([parseInt(ch), parseInt(count)]);
			spectrum_data_ev.push([parseFloat(ev), parseInt(count)]);
		}
	}
	
	if(!time)
		return false;
	
	var min_count = find_min_count(spectrum_data_ch);
	
	var sp_info = sp_info_gps(file_comment);
	sp_info.push(["計測時間", format_time(time)]);
	
	var spectrum = {
		file: file,
		file_comment: file_comment,
		sp_info: sp_info,
		time: time,
		min_cps: min_count / time,
		spectrum_data_ch: convert_count2cps(time, spectrum_data_ch),
		spectrum_data_ev: convert_count2cps(time, spectrum_data_ev)
	};
	return spectrum;
}

function draw_graph_ta100_spectrum(file, file_comment, data) {
	// フォーマットのチェック
	if(data.match(/^\[SPECTRUM\]\r?\n.*\r?\n.*(MeV).*\r?\n.*\r?\n.*(MeV).*\r?\n.*\r?\n.*(CPS).*\r?\n.*\r?\n.*(CPS).*\r?\n\r?\n\r?\n/)) {
		// TA100 Spectrumモード
	} else {
		return false;
	}
	
	var lines = split_line(data);
	
	var time;
	if(data.match(/^\[SPECTRUM\]\r?\n[^\t]+\t([0-9]+)\r?\n/)) {
		time = parseInt(RegExp.$1);
	}
	
	var spectrum_data_ch = [];
	var spectrum_data_ev = [];
	
	for(var i in lines) {
		var line = lines[i];
		if(line == "") {
			continue;
		}
		if(line.match(/^([0-9]+)\t([0-9\.]+)\t([0-9]+)$/)) {
			var ch = RegExp.$1;
			var ev = RegExp.$2;
			var count = RegExp.$3;
			
			spectrum_data_ch.push([parseInt(ch), parseInt(count)]);
			spectrum_data_ev.push([parseFloat(ev) * 1000, parseInt(count)]);
		}
	}
	
	if(!time)
		return false;
	
	var min_count = find_min_count(spectrum_data_ch);
	
	var sp_info = sp_info_gps(file_comment);
	sp_info.push(["計測時間", format_time(time)]);
	
	var spectrum = {
		file: file,
		file_comment: file_comment,
		sp_info: sp_info,
		time: time,
		min_cps: min_count / time,
		spectrum_data_ch: convert_count2cps(time, spectrum_data_ch),
		spectrum_data_ev: convert_count2cps(time, spectrum_data_ev)
	};
	return spectrum;
}

// TS100B系のPCソフトウェアもこのフォーマット
function draw_graph_tn300b_spectrum(file, file_comment, data) {
	var lines = split_line(data);
	
	var sp_info = sp_info_gps(file_comment);
	var additional_sp_info_html = '';
	
	// 全ての行で9カラムのカンマ区切りなら，CSV保存されたファイル
	// カンマをタブに置き換えればそのまま利用できる．
	var is_csv = true;
	for(var i = 0; i < lines.length; i++) {
		var fields = lines[i].split(",");
		if(fields.length != 9) {
			is_csv = false;
			break;
		}
	}
	if(is_csv) {
		for(var i = 0; i < lines.length; i++) {
			lines[i] = lines[i].replace(/,+$/, "").replace(/,/g, "\t");
		}
	}
	
	if(lines.length < 5) {
		return false;
	}
	
	// フォーマットのチェック
	if(!lines[2].match(/^.*\t([0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2})$/)) {
		return false;
	}
	sp_info.push(["測定日", RegExp.$1]);
	if(!lines[3].match(/^.*\t([0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2})$/)) {
		return false;
	}
	sp_info.push(["測定開始時刻", RegExp.$1]);
	if(!lines[4].match(/^.*\t([0-9]+)/)) {
		return false;
	}
	var time = parseInt(RegExp.$1);
	sp_info.push(["測定時間", RegExp.$1 + "秒"]);
	if(!lines[5].match(/^.*\t([0-9\.]+) Bq\/kg$/)) {
		return false;
	}
	sp_info.push(["定量下限値(Bq/kg)", parseFloat(RegExp.$1)]);
	
	
	var spinfolist = [0,1,6,7,8,9,10,11];
	for(var idx = 0; idx < spinfolist.length; idx++) {
		if(lines[spinfolist[idx]].match(/^([^#].*)\t(.*)$/)) {
			sp_info.push([RegExp.$1, RegExp.$2]);
		}
	};
	
	var isotope_start_line = 0;
	var spectrum_start_line = 0;
	var sharp_count = 0;
	for(var i = 0; i < 1000; i++) {
		if(lines[i].match(/^#/)) {
			sharp_count++;
			// 1回見つけたら，その次から核種分析結果
			if(sharp_count == 1) {
				isotope_start_line = i + 1;
			}
			// 2回見つけたら，その次の行からスペクトル
			if(sharp_count == 2) {
				spectrum_start_line = i + 1;
				break;
			}
		}
	}
	if(spectrum_start_line == 0) {
		return false;
	}
	
	
	if(file_comment.match(/^ *\[#([0-9]+)\]/)) {
		var no = parseInt(RegExp.$1);
		
		var fields_head = lines[isotope_start_line - 1].split("\t");
		var fields_data = lines[isotope_start_line + no - 1].split("\t");
		
		additional_sp_info_html += '<table class="csv">';
		
		additional_sp_info_html += '<tr>';
		for(var i in fields_head) {
			additional_sp_info_html += '<th>' + fields_head[i] + '</th>';
		}
		additional_sp_info_html += '</tr>';
		
		additional_sp_info_html += '<tr>';
		for(var i in fields_data) {
			additional_sp_info_html += '<td>' + fields_data[i] + '</td>';
		}
		additional_sp_info_html += '</tr>';
		
		additional_sp_info_html += '</table>';
	}
	
	var spectrum_data_ch = [];
	var spectrum_data_ev = [];
	
	for(var ch = 0; ch < 4096; ch++) {
		if((spectrum_start_line + ch < lines.length) && lines[spectrum_start_line + ch].match(/^([0-9\.]+)\t([0-9]+)$/)) {
			var ev = RegExp.$1;
			var count = RegExp.$2;
			
			spectrum_data_ch.push([ch, parseInt(count)]);
			spectrum_data_ev.push([parseFloat(ev), parseInt(count)]);
		} else {
			break;
		}
	}
	if(ch == 512 || ch == 1024 || ch == 2048 || ch == 4096) {
	} else {
		alert("channel count error: " + ch + " ch");
		return false;
	}
	
	var min_count = find_min_count(spectrum_data_ch);
	
	var spectrum = {
		file: file,
		file_comment: file_comment,
		sp_info: sp_info,
		time: time,
		min_cps: min_count / time,
		spectrum_data_ch: convert_count2cps(time, spectrum_data_ch),
		spectrum_data_ev: convert_count2cps(time, spectrum_data_ev),
		additional_sp_info_html: additional_sp_info_html
	}
	
	return spectrum;
}

function draw_graph_tn300b_2_spectrum(file, file_comment, data) {
	var lines = split_line(data);
	
	
	// フォーマットのチェック
	if(!lines[0].match(/^\[全般\]$/)) {
		return false;
	}
	
	var sp_info = sp_info_gps(file_comment);
	var sp_info_group = '';
	var additional_sp_info_html = '';
	var spectrum_ch = 0;
	var spectrum_data_ch = [];
	var spectrum_data_ev = [];
	
	additional_sp_info_html += '<table class="csv">';
	
	for(var i = 0; i < lines.length; i++) {
		if(lines[i].match(/^\[(.*)\]$/)) {
			sp_info_group = RegExp.$1;
			
			if(sp_info_group != 'スペクトル') {
				additional_sp_info_html += '<tr>';
				additional_sp_info_html += '<th colspan="2">' + sp_info_group + '</th>';
				additional_sp_info_html += '</tr>';
			}
			
			continue;
		}
		var data = lines[i].split("\t");
		if(data[1] == undefined) {
			data[1] = '';
		}
		
		if(sp_info_group == 'スペクトル') {
			if(lines[i].match(/^#/)) {
				continue;
			}
			
			var ev = parseFloat(data[0]);
			var count = parseFloat(data[1]);
			
			spectrum_data_ch.push([spectrum_ch++, count]);
			spectrum_data_ev.push([ev, count]);
		} else {
			if(data[0] != "") {
				
				additional_sp_info_html += '<tr>';
				additional_sp_info_html += '<th>' + data[0] + '</th>';
				additional_sp_info_html += '<td style="text-align: right;">' + data[1] + '</td>';
				additional_sp_info_html += '</tr>';
				
				if(data[0] == "測定時間(秒)") {
					var time = parseInt(data[1]);
				}
			}
		}
	}
	
	additional_sp_info_html += '</table>';
	
	if(spectrum_ch == 512 || spectrum_ch == 1024 || spectrum_ch == 2048 || spectrum_ch == 4096) {
	} else if(spectrum_ch == 461 || spectrum_ch == 442 || spectrum_ch == 446 || spectrum_ch == 428) {
		// 何故かch数がおかしい．仕方ないので許容する．
	} else {
		alert("channel count error: " + spectrum_ch + " ch");
		return false;
	}
	
	var min_count = find_min_count(spectrum_data_ch);
	
	var spectrum = {
		file: file,
		file_comment: file_comment,
		sp_info: sp_info,
		additional_sp_info_html: additional_sp_info_html,
		time: time,
		min_cps: min_count / time,
		spectrum_data_ch: convert_count2cps(time, spectrum_data_ch),
		spectrum_data_ev: convert_count2cps(time, spectrum_data_ev)
	}
	
	return spectrum;
}

function draw_graph_xml_spectrum(file, file_comment, data) {
	// フォーマットのチェック
	if(data.match(/^\<\?xml/)) {
		// XML ファイルっぽい
	} else {
		return false;
	}
	
	var xml = $($.parseXML(data));
	
	var data;
	var datastr = xml.find("N42InstrumentData Measurement Spectrum ChannelData").text();
	if(datastr == "") {
		return false;
	} else {
		data = [];
		$.each(datastr.split(/[ \r\n]+/), function(i, count) {
			data.push([i, parseInt(count)]);
		});
	}
	
	var slope_model = 0;
	var slope_formstr = xml.find("N42InstrumentData Equation").attr("Form");
	if(slope_formstr == "E = Term0 + Term1*Ch") {
		slope_model = 2;
	}
	if(slope_formstr == "E = Term0 + Term1*Ch + Term2*Term2*Ch") {
		slope_model = 3;
	}
	if(slope_formstr == "E = Term0 + Term1*Ch + Term2*Ch*Ch") {
		slope_model = 3;
	}
	if(slope_model == 0) {
		return false;
	}
	
	var slope;
	var slopestr = xml.find("N42InstrumentData Equation Coefficients").text();
	if(slopestr == "") {
		return false;
	} else {
		slope = [];
		$.each(slopestr.split(/[ \r\n]+/), function(i, val) {
			slope.unshift(parseFloat(val));
		});
	}
	
	
	var time;
	var timestr = xml.find("N42InstrumentData Measurement Spectrum LiveTime").text();
	if(timestr == "") {
		return false;
	} else {
		if(timestr.match(/^PT([0-9]+)S$/)) {
			time = parseInt(RegExp.$1);
		} else {
			return false;
		}
	}
	
	
	var date_mea = xml.find("N42InstrumentData Measurement Spectrum StartTime").text();
	
	if(!data || !slope || !time) {
		return false;
	}
	
	var additional_sp_info_html = '';
	
	xml.find("N42InstrumentData Measurement AnalysisResults NuclideAnalysis Nuclide").each(function() {
		var name = $(this).find("NuclideName").text();
		var type = $(this).find("NuclideType").text();
		var confidence = $(this).find("NuclideIDConfidenceDescription").text();
		
		additional_sp_info_html += '<tr>';
		additional_sp_info_html += '<td style="text-align: center;">' + name + '</td>';
		additional_sp_info_html += '<td style="text-align: center;">' + type + '</td>';
		additional_sp_info_html += '<td style="text-align: center;">' + confidence + '</td>';
		additional_sp_info_html += '</tr>';
	});
	
	if(additional_sp_info_html != '') {
		additional_sp_info_html = '<table class="csv">'
			+ '<tr>'
			+ '<th>Name</th>'
			+ '<th>Type</th>'
			+ '<th>IDConfidence</th>'
			+ '</tr>'
			+ additional_sp_info_html
			+ '</table>';
	}
	
	
	
	var spectrum_data_ch = [];
	var spectrum_data_ev = [];
	
	var min_count = find_min_count(data);
	for(var i in data) {
		spectrum_data_ch.push([data[i][0], data[i][1]]);
		var ev;
		if(slope_model == 2) {
			ev = data[i][0] * slope[0] + slope[1];
		} else if(slope_model == 3) {
			ev = data[i][0] * data[i][0] * slope[0] + data[i][0] * slope[1] + slope[2];
		} else {
			return false;
		}
		spectrum_data_ev.push([ev, data[i][1]]);
	}
	
	var sp_info = sp_info_gps(file_comment);
	sp_info.push(["計測時間", format_time(time)]);
	
	var spectrum = {
		file: file,
		file_comment: file_comment,
		sp_info: sp_info,
		additional_sp_info_html: additional_sp_info_html,
		time: time,
		min_cps: min_count / time,
		spectrum_data_ch: convert_count2cps(time, spectrum_data_ch),
		spectrum_data_ev: convert_count2cps(time, spectrum_data_ev)
	};
	if(date_mea) {
		spectrum['sp_info'].push(["計測時刻", date_mea]);
	}
	return spectrum;
}


function draw_graph_bqmon_spectrum(file, file_comment, data) {
	// フォーマットのチェック
	if(data.match(/^\<\?xml/)) {
		// XML ファイルっぽい
	} else {
		return false;
	}
	
	var bqmon_xml = $($.parseXML(data));
	
	var sp_info_mapping = [
		["SampleInfo Name",             "品名",    ""],
		["SampleInfo Location",        "採取場所", ""],
		["SampleInfo Time",            "採取日時", ""],
		["SampleInfo Weight",          "重量",     "kg"],
		["SampleInfo Volume",          "体積",     "l"],
		["SampleInfo Note",            "備考",     ""],
		["DeviceConfigReference Name", "デバイス構成", ""],
		["StartTime",                  "測定開始日時", ""],
		["EndTime",                    "測定終了日時", ""]
	];
	
	var parse_xml = function(xml, mode) {
		var data;
		var sp_info = sp_info_gps(file_comment);
		
		for(var i in sp_info_mapping) {
			data = xml.find(sp_info_mapping[i][0]).text();
			sp_info.push([sp_info_mapping[i][1], data + sp_info_mapping[i][2]]);
		}
		
		var slope = [];
		
		var spectrum_name;
		if(mode == 'BG') {
			spectrum_name = "BackgroundEnergySpectrum";
		} else {
			spectrum_name = "EnergySpectrum";
		}
		var time;
		data = xml.find(spectrum_name + " MeasurementTime").text();
		if(data == "") {
			return false;
		} else {
			time = parseFloat(data);
		}
		
		if(xml.find(spectrum_name + " EnergyCoefficient").text() != "") {
			// 旧形式の場合の係数取得
			data = xml.find(spectrum_name + " EnergyCoefficient").text();
			if(data == "") {
				data = xml.find(spectrum_name + " EnergyCoefficient").text();
				if(data == "") {
					return false;
				} else {
					slope[0] = parseFloat(data);
				}
			} else {
				slope[0] = parseFloat(data);
			}
			data = xml.find(spectrum_name + " EnergyOffset").text();
			if(data == "") {
				data = xml.find(spectrum_name + " EnergyOffset").text();
				if(data == "") {
					return false;
				} else {
					slope[1] = parseFloat(data);
				}
			} else {
				slope[1] = parseFloat(data);
			}
		} else if(xml.find("ResultData EnergyCoefficient").text() != "") {
			// 一番古い形式の場合の係数取得
			data = xml.find("ResultData EnergyCoefficient").text();
			if(data == "") {
				data = xml.find("ResultData EnergyCoefficient").text();
				if(data == "") {
					return false;
				} else {
					slope[0] = parseFloat(data);
				}
			} else {
				slope[0] = parseFloat(data);
			}
			data = xml.find("ResultData EnergyOffset").text();
			if(data == "") {
				data = xml.find("ResultData EnergyOffset").text();
				if(data == "") {
					return false;
				} else {
					slope[1] = parseFloat(data);
				}
			} else {
				slope[1] = parseFloat(data);
			}
		} else {
			// 新形式の場合の係数取得（Ver 0.98～）
			data = xml.find(spectrum_name + " EnergyCalibration").text();
			if(data != "") {
				xml.find(spectrum_name + " EnergyCalibration Coefficient").each(function() {
					slope.unshift(parseFloat($(this).text()));
				});
			} else {
				alert("Energy parse error.");
			}
			if(slope.length != 3) {
				alert("Energy parse error. " + slope.length);
			}
		}
		
		var spectrum_data = [];
		
		var spectrum_ch = 0;
		xml.find(spectrum_name + " Spectrum DataPoint").each(function() {
			spectrum_data.push([spectrum_ch++, parseInt($(this).text())]);
		});
		
		if(spectrum_ch == 0) {
			return false;
		}
		
		var spectrum_data_ch = [];
		var spectrum_data_ev = [];
		
		var min_count = find_min_count(spectrum_data);
		for(var i in spectrum_data) {
			spectrum_data_ch.push([spectrum_data[i][0], spectrum_data[i][1]]);
			if(slope.length == 2) {
				spectrum_data_ev.push([spectrum_data[i][0] * slope[0] + slope[1], spectrum_data[i][1]]);
			} else {
				spectrum_data_ev.push([spectrum_data[i][0] * spectrum_data[i][0] * slope[0]
											+ spectrum_data[i][0] * slope[1] + slope[2], spectrum_data[i][1]]);
			}
		}
		
		
		var additional_sp_info_html = '';
		
		var spectrum = {
			name: mode,
			file: file,
			file_comment: file_comment + ' ' + sp_info[0],
			sp_info: sp_info,
			additional_sp_info_html: additional_sp_info_html,
			time: time,
			min_cps: min_count / time,
			spectrum_data_ch: convert_count2cps(time, spectrum_data_ch),
			spectrum_data_ev: convert_count2cps(time, spectrum_data_ev)
		};
		
		return spectrum;
	};
	
	var spectrums = [];
	
	bqmon_xml.find("ResultDataList ResultData").each(function() {
		var xml = $(this);
		
		spectrums.push(parse_xml(xml, 'SPE'));
		spectrums.push(parse_xml(xml, 'BG'));
		
	});
	if(spectrums.length == 0) {
		spectrums.push(parse_xml(bqmon_xml, 'SPE'));
		spectrums.push(parse_xml(bqmon_xml, 'BG'));
	}
	
	var return_spectrums = {
		data: spectrums
	}
	
	return return_spectrums;
}


function draw_graph_fnf401_spectrum(file, file_comment, data) {
	// フォーマットのチェック
	// 条件 測定日
	if(data.match(/^<条件>\r?\n測定日,/)) {
		// FNF-401 ファイルっぽい
	} else {
		return false;
	}
	
	var lines = split_line(data);
	
	
	var additional_sp_info_html = '';
	
	var slope;
	var data = [[0,0],[1,0]];			// 最初の2chは測定時間が入る
	var sp_info = sp_info_gps(file_comment);
	var mode = "";
	var time;
	var peak_info = {};
	for(var i in lines) {
		var line = lines[i];
		if(line == "<条件>") {
			mode = "CONDITION";
			continue;
		}
		if(line == "<濃度演算結果>") {
			mode = "ISOTOPE";
			additional_sp_info_html += '<table class="csv" style="float: left;">';
			additional_sp_info_html += '<tr>';
			additional_sp_info_html += '<th>核種</th>';
			additional_sp_info_html += '<th>濃度[Bq/kg]</th>';
			additional_sp_info_html += '<th>濃度誤差</th>';
			additional_sp_info_html += '<th>ピークCh</th>';
			additional_sp_info_html += '<th>Total[counts]</th>';
			additional_sp_info_html += '<th>BASE[counts]</th>';
			additional_sp_info_html += '<th>Net[Counts]</th>';
			additional_sp_info_html += '<th>Net誤差</th>';
			additional_sp_info_html += '</tr>';
			continue;
		}
		if(line == "<スペクトル>") {
			mode = "SPECTRUM";
			continue;
		}
		if(line == "<ピーク積分範囲>") {
			mode = "PEAK";
			additional_sp_info_html += '<table class="csv" style="float: left; margin-left: 1em;">';
			additional_sp_info_html += '<tr>';
			additional_sp_info_html += '<th>核種</th>';
			additional_sp_info_html += '<th>Lch</th>';
			additional_sp_info_html += '<th>Hch</th>';
			additional_sp_info_html += '</tr>';
			continue;
		}
		if(mode == "ISOTOPE" && line.match(/^ *$/)) {
			additional_sp_info_html += '</table>';
			mode = "";
			continue;
		}
		if(mode == "PEAK" && line.match(/^ *$/)) {
			additional_sp_info_html += '</table><div style="clear: left;"></div>';
			mode = "";
			continue;
		}
		if(mode == "SPECTRUM" && line.match(/^([0-9]+),([0-9]+),([0-9\.]+)$/)) {
			var ch = parseInt(RegExp.$1);
			var count = parseInt(RegExp.$2);
			data.push([ch, count]);
			continue;
		}
		if(mode == "SPECTRUM" && line.match(/^0,([0-9]+),([0-9\.]+),Live Time$/)) {
			time = parseInt(RegExp.$1);
			continue;
		}
		if(mode == "CONDITION" && line.match(/^(.*),(.*)$/)) {
			sp_info.push([RegExp.$1, RegExp.$2]);
			continue;
		}
		if(mode == "ISOTOPE" && line.match(/^(.*)(,(.*)){7}$/)) {
			var fields = line.split(",");
			if(fields.length == 8 && fields[0] != "核種") {
				additional_sp_info_html += '<tr id="isotope_' + fields[0] + '"><th>' + fields[0]
					+ '</th><td style="text-align: right;">' + fields[1]
					+ '</td><td style="text-align: right;">' + fields[2]
					+ '</td><td style="text-align: right;">' + fields[3]
					+ '</td><td style="text-align: right;">' + fields[4]
					+ '</td><td style="text-align: right;">' + fields[5]
					+ '</td><td style="text-align: right;">' + fields[6]
					+ '</td><td style="text-align: right;">' + fields[7]
					+ '</td></tr>';
			}
			continue;
		}
		if(mode == "PEAK" && line.match(/^(.*)(,(.*)){2}$/)) {
			var fields = line.split(",");
			if(fields.length == 3 && fields[0] != "核種") {
				additional_sp_info_html += '<tr><th>' + fields[0]
					+ '</th><td style="text-align: right;">' + fields[1]
					+ '</td><td style="text-align: right;">' + fields[2]
					+ '</td></tr>';
				peak_info[fields[0]] = [
					parseFloat(fields[1]),
					parseFloat(fields[2]),
					(parseFloat(fields[1]) + parseFloat(fields[2])) / 2];
			}
			continue;
		}
	}
	if(mode == "PEAK") {
		additional_sp_info_html += '</table><div style="clear: left;"></div>';
	}
	
	// エネルギー換算係数を I-131 と Cs-134 のピーク検出領域から求める
	if(!peak_info['I-131'] || !peak_info['Cs-134']) {
		alert("[FNF-401] I-131とCs-134のピーク領域が無いためエネルギー換算が行えません");
		return false;
	}
	
	var slope_a = (796 - 365) / (peak_info['Cs-134'][2] - peak_info['I-131'][2]);
	var slope_b = 365 - peak_info['I-131'][2] * slope_a;
	var slope = [slope_a, slope_b];
	
	if(data.length == 2 || !slope || !time) {
		return false;
	}
	
	var spectrum_data_ch = [];
	var spectrum_data_ev = [];
	
	var min_count = find_min_count(data);
	for(var i in data) {
		spectrum_data_ch.push([data[i][0], data[i][1]]);
		spectrum_data_ev.push([data[i][0] * slope[0] + slope[1], data[i][1]]);
	}
	
	var additional_html_callback = function() {
		for(var isotope in peak_info) {
			(function(i) {
				$("#isotope_" + i).bind('mouseenter', function() {
					$(this).css('background', '#ffdddd');
					
					graph_clear_marking();
					
					var marking_option = {
						grid: {
							markings: [
								{
									color: '#ffdddd',
									xaxis: {
										from: peak_info[i][0],
										to: peak_info[i][1]
									}
								}
							]
						}
					};
					draw_graph_common_update(marking_option);
				}).bind('mouseleave', function() {
					$(this).css('background', '');
					
					plot.clearSelection();
					graph_clear_marking();
				});
			})(isotope);
		}
	};
	
	var spectrum = {
		file: file,
		file_comment: file_comment,
		sp_info: sp_info,
		additional_sp_info_html: additional_sp_info_html,
		additional_html_callback: additional_html_callback,
		time: time,
		min_cps: min_count / time,
		spectrum_data_ch: convert_count2cps(time, spectrum_data_ch),
		spectrum_data_ev: convert_count2cps(time, spectrum_data_ev)
	};
	return spectrum;
}

function draw_graph_spe_spectrum(file, file_comment, data) {
	// フォーマットのチェック
	if(data.match(/^\$.*:\r?\n/)) {
		// SPE ファイルっぽい
	} else {
		return false;
	}
	
	// PDS-100GNのファイルは，$SPEC_REM: の中に \r のみの行がある
	var lines = split_line(data);
	
	var slope;
	var data = [];
	var mode = "";
	var cur_ch;
	var ch_max;
	var time;
	var date_mea;
	var comment = '';
	var temper;
	var mnd_results;
	var mnd_message;
	var doserate;
	var gps_long;
	var gps_latt;
	for(var i in lines) {
		var line = lines[i];
		if(line == "$ENER_FIT:") {
			mode = "ENER_FIT";
			continue;
		}
		if(line == "$DATA:") {
			mode = "DATA_START";
			continue;
		}
		if(line == "$MEAS_TIM:") {
			mode = "MEAS_TIM";
			continue;
		}
		if(line == "$SPEC_REM:") {
			mode = "SPEC_REM";
			continue;
		}
		if(line == "$DATE_MEA:") {
			mode = "DATE_MEA";
			continue;
		}
		if(line == "$TEMPER:") {
			mode = "TEMPER";
			continue;
		}
		if(line == "$TEMPERATURE:") {
			mode = "TEMPER";
			continue;
		}
		if(line == "$GPS_LONG:") {
			mode = "GPS_LONG";
			continue;
		}
		if(line == "$GPS_LATT:") {
			mode = "GPS_LATT";
			continue;
		}
		if(line.match(/^\$.*:$/)) {
			mode = "";
			continue;
		}
		if(mode == "TEMPER" && line.match(/^([0-9\.]+)$/)) {
			temper = parseFloat(RegExp.$1);
			mode = "";
			continue;
		}
		if(mode == "DATE_MEA" && line.match(/^(.*)$/)) {
			date_mea = RegExp.$1;
			continue;
		}
		if(mode == "SPEC_REM" && line.match(/^ID: *(.*)$/)) {
			comment += RegExp.$1 + '<br>';
			continue;
		}
		if(mode == "SPEC_REM" && line.match(/^Dose Rate : *(.*)$/)) {
			doserate = RegExp.$1;
			doserate = doserate.replace(/..Sv\/h/, "μSv/h");  // SJISコードの修正
			continue;
		}
		if(mode == "SPEC_REM" && line.match(/^NMD results : *(.*)$/)) {
			mnd_results = RegExp.$1;
			continue;
		}
		if(mode == "SPEC_REM" && line.match(/^NMD message : *(.*)$/)) {
			mnd_message = RegExp.$1;
			continue;
		}
		if(mode == "SPEC_REM" && line.match(/^(.*)$/)) {
			comment += RegExp.$1 + '<br>';
			continue;
		}
		if(mode == "DATA_START" && line.match(/^0 ([0-9]+)/)) {
			// 開始chが0以外は未サポート
			ch_max = parseInt(RegExp.$1);
			cur_ch = 0;
			mode = "DATA";
			continue;
		}
		if(mode == "DATA" && line.match(/^ *([0-9]+)$/)) {
			var count = RegExp.$1;
			data.push([cur_ch++, parseInt(count)]);
			if(cur_ch > ch_max) {
				mode = "";
			}
			continue;
		}
		// ENER_FIT は引数2つと3つの2パターンがある．
		if(mode == "ENER_FIT" && line.match(/^([0-9\-\.]+) ([0-9\-\.]+) ([0-9\-\.]+|-1.#QNAN000)$/)) {
			var a = RegExp.$1;
			var b = RegExp.$2;
			var c = RegExp.$3;
			if(c == '-1.#QNAN000') {
				c = 0;
			} else if(parseFloat(c) != 0) {
				// 1次関数補正(?)のみサポート
				return false;
			}
			slope = [parseFloat(b), parseFloat(a)];
			mode = "";
			continue;
		}
		if(mode == "ENER_FIT" && line.match(/^([0-9\-\.]+) ([0-9\-\.]+)$/)) {
			var a = RegExp.$1;
			var b = RegExp.$2;
			slope = [parseFloat(b), parseFloat(a)];
			mode = "";
			continue;
		}
		// 1つめが live time + dead time (real time)，2つめが live time
		if(mode == "MEAS_TIM" && line.match(/^([0-9\.]+) ([0-9\.]+)$/)) {
			var total_time = RegExp.$1;
			var live_time = RegExp.$2;
			time = parseFloat(live_time);
			mode = "";
			continue;
		}
		// GPS情報
		if(mode == "GPS_LONG" && line.match(/^(.*)$/)) {
			gps_long = RegExp.$1;
			continue;
		}
		if(mode == "GPS_LATT" && line.match(/^(.*)$/)) {
			gps_latt = RegExp.$1;
			continue;
		}
	}
	
	if(!data || !slope || !time) {
		return false;
	}
	
	var spectrum_data_ch = [];
	var spectrum_data_ev = [];
	
	var min_count = find_min_count(data);
	for(var i in data) {
		spectrum_data_ch.push([data[i][0], data[i][1]]);
		spectrum_data_ev.push([data[i][0] * slope[0] + slope[1], data[i][1]]);
	}
	
	var sp_info = sp_info_gps(file_comment);
	sp_info.push(["計測時間", format_time(time)]);
	
	var spectrum = {
		file: file,
		file_comment: file_comment,
		sp_info: sp_info,
		time: time,
		min_cps: min_count / time,
		spectrum_data_ch: convert_count2cps(time, spectrum_data_ch),
		spectrum_data_ev: convert_count2cps(time, spectrum_data_ev)
	};
	if(date_mea) {
		spectrum['sp_info'].push(["計測時刻", date_mea]);
	}
	if(comment != '') {
		spectrum['sp_info'].push(["コメント", comment]);
	}
	if(doserate) {
		spectrum['sp_info'].push(["線量率", doserate]);
	}
	if(mnd_results) {
		spectrum['sp_info'].push(["検出核種", mnd_results]);
	}
	if(mnd_message) {
		spectrum['sp_info'].push(["検出コメント", mnd_message]);
	}
	if(temper) {
		spectrum['sp_info'].push(["温度", temper]);
	}
	if(gps_long && gps_latt) {
		var gpslink = '<a href="http://maps.google.co.jp/maps?q='
			+ gps_latt + ',' + gps_long
			+ '&z=18&t=h'
			+ '" target="_blank">位置をGoogleMapで表示</a><br>'
			+ '(LATT:' + gps_latt
			+ ', LONG:' + gps_long
			+ ')';
		spectrum['sp_info'].push(["位置情報", gpslink]);
	}
	return spectrum;
}


function draw_graph_pra_spectrum(file, file_comment, data) {
	// フォーマットのチェック
	if(data.match(/^PRA:.*\r?\n/)) {
		// PRA ファイルっぽい
	} else {
		return false;
	}
	
	var lines = split_line(data);
	
	var spectrum_data_ch = [];
	var spectrum_data_ev = [];
	
	var sp_info = sp_info_gps(file_comment);
	
	var slope = [undefined, undefined];
	var data = [];
	var cur_ch = 0;
	var time;
	for(var i in lines) {
		var line = lines[i];
		if(line.match(/^PRA: *([0-9\.]+) +([0-9\.]+) +([0-9\-\.]+)$/)) {
			time = parseInt(RegExp.$1);
			slope = [parseFloat(RegExp.$2), parseFloat(RegExp.$3)];
		}
		else if(line.match(/^([^:]+): *(.+)$/)) {
			sp_info.push([RegExp.$1, RegExp.$2]);
		}
		else if(line.match(/^([0-9\.]+)[\t,]([0-9]+)$/)) {
			var height = parseFloat(RegExp.$1);
			var count = parseInt(RegExp.$2);
			var ev = height * slope[0] + slope[1];
			
			spectrum_data_ch.push([cur_ch, count]);
			spectrum_data_ev.push([ev, count]);
			cur_ch++;
		}
	}
	
	if(!data || !slope || !time) {
		return false;
	}
	
	var min_count = find_min_count(spectrum_data_ch);
	
	sp_info.unshift(["計測時間", format_time(time)]);
	
	var spectrum = {
		file: file,
		file_comment: file_comment,
		sp_info: sp_info,
		time: time,
		min_cps: min_count / time,
		spectrum_data_ch: convert_count2cps(time, spectrum_data_ch),
		spectrum_data_ev: convert_count2cps(time, spectrum_data_ev)
	};
	return spectrum;
}

function find_min_count(data) {
	var min_count = 0;
	for(var i in data) {
		if((min_count == 0 || min_count > data[i][1]) && data[i][1] > 0)
			min_count = data[i][1];
	}
	
	return min_count;
}

function draw_graph_wintmca_spectrum(file, file_comment, data) {
	// フォーマットのチェック
	if(data.match(/^SpectrumName : .*\r?\n/)) {
		// winTMCA32 ファイルっぽい
	} else {
		return false;
	}
	
	var lines = split_line(data);
	
	
	var additional_sp_info_html = '';
	
	var slope;
	var data = [];
	var sp_info = sp_info_gps(file_comment);
	var cur_ch = 0;
	var time;
	var peak_info = {};
	for(var i in lines) {
		var line = lines[i];
		if(line.match(/^ROI +([0-9]+): *([0-9]+) +([0-9]+) +[0-9A-F]+ *$/)) {
			var id = parseInt(RegExp.$1);
			var lch = parseInt(RegExp.$2);
			var hch = parseInt(RegExp.$3);
			
			if(additional_sp_info_html == "") {
				additional_sp_info_html += '<table class="csv">';
				additional_sp_info_html += '<tr>';
				additional_sp_info_html += '<th>ID</th>';
				additional_sp_info_html += '<th>Lch</th>';
				additional_sp_info_html += '<th>Hch</th>';
				additional_sp_info_html += '</tr>';
			}
			
			additional_sp_info_html += '<tr id="isotope_' + id + '"><th>' + id
				+ '</th><td style="text-align: right;">' + lch
				+ '</td><td style="text-align: right;">' + hch
				+ '</td></tr>';
			
			peak_info[id] = [parseInt(lch), parseInt(hch)];
			continue;
		}
		if(line.match(/^([0-9]+)(,([0-9]+)){7}$/)) {
			var fields = line.split(",");
			if(fields.length == 8) {
				for(var n = 0; n < 8; n++) {
					data.push([cur_ch++, parseInt(fields[n])]);
				}
			}
			continue;
		}
		if(line.match(/^(.{12}) : (.*)$/)) {
			var key = RegExp.$1;
			var value = RegExp.$2;
			
			if(key == "Livetime    ") {
				time = parseFloat(value);
			} else if(key == "CalibCoeff  ") {
				slope = [];
				var coeff = value.split(" ");
				for(var n = 0; n < 4; n++) {
					var c = coeff[n];
					slope.push(parseFloat(c.replace(/^[a-d]=/, "")));
				}
			}
			sp_info.push([key, value]);
			
			continue;
		}
	}
	
	if(additional_sp_info_html != "") {
		additional_sp_info_html += '</table>';
	}
	
	if(data.length == 0 || !slope || !time) {
		return false;
	}
	
	var spectrum_data_ch = [];
	var spectrum_data_ev = [];
	
	var min_count = find_min_count(data);
	for(var i in data) {
		spectrum_data_ch.push([data[i][0], data[i][1]]);
		spectrum_data_ev.push([Math.pow(data[i][0], 3) * slope[0] + Math.pow(data[i][0], 2) * slope[1]
			 + data[i][0] * slope[2] + slope[3], data[i][1]]);
	}
	
	var additional_html_callback = function() {
		for(var isotope in peak_info) {
			(function(i) {
				$("#isotope_" + i).bind('mouseenter', function() {
					$(this).css('background', '#ffdddd');
					
					graph_clear_marking();
					
					var marking_option = {
						grid: {
							markings: [
								{
									color: '#ffdddd',
									xaxis: {
										from: peak_info[i][0],
										to: peak_info[i][1]
									}
								}
							]
						}
					};
					draw_graph_common_update(marking_option);
				}).bind('mouseleave', function() {
					$(this).css('background', '');
					
					plot.clearSelection();
					graph_clear_marking();
				});
			})(isotope);
		}
	};
	
	var spectrum = {
		file: file,
		file_comment: file_comment,
		sp_info: sp_info,
		additional_sp_info_html: additional_sp_info_html,
		additional_html_callback: additional_html_callback,
		time: time,
		min_cps: min_count / time,
		spectrum_data_ch: convert_count2cps(time, spectrum_data_ch),
		spectrum_data_ev: convert_count2cps(time, spectrum_data_ev)
	};
	return spectrum;
}

function draw_graph_emf211_spectrum(file, file_comment, data) {
	var lines = split_line(data);
	
	var spectrum_start_lineno;
	var spectrum_channel;
	var isotope_start_lineno;
	
	if(lines.length < 24) {
		return false;
	}
	
	// フォーマットのチェック
	var i = 24;
	if(lines[i].match(/^([0-9]+)$/)) {
		var count = parseInt(RegExp.$1);
		if(i > 100) {
			// 通常22
			return false;
		}
		i += count;
	}
	i += 12;
	if(lines[i] != "I-131") {
		return false;
	}
	isotope_start_lineno = i;
	i += 9;
	if(lines[i] != "Cs-137") {
		return false;
	}
	i += 9;
	if(lines[i] != "Cs-134") {
		return false;
	}
	i += 9;
	if(lines[i] != "K-40") {
		return false;
	}
	i += 9;
	if(lines[i] != "1024") {
		return false;
	}
	spectrum_channel = parseInt(lines[i]);
	spectrum_start_lineno = i + 1;
	
	// エネルギー校正ポイント
	var slope_point = [];
	if(lines[17] == "352.0") {
		slope_point.push([parseInt(lines[16]), parseFloat(lines[17])]);
	} else {
		return false;
	}
	if(lines[19] == "609.0") {
		slope_point.push([parseInt(lines[18]), parseFloat(lines[19])]);
	} else {
		return false;
	}
	if(lines[21] == "1461.0") {
		slope_point.push([parseInt(lines[20]), parseFloat(lines[21])]);
	} else {
		return false;
	}
	if(lines[23] == "2615.0") {
		slope_point.push([parseInt(lines[22]), parseFloat(lines[23])]);
	} else {
		return false;
	}
	
	var ch2ev = function(ch) {
		var slope_no = slope_point.length - 2;
		for(var s = 0; s < slope_point.length - 1; s++) {
			if(ch <= slope_point[s + 1][0]) {
				slope_no = s;
				break;
			}
		}
		var slope_ch_diff = slope_point[slope_no + 1][0] - slope_point[slope_no][0];
		var slope_ev_diff = slope_point[slope_no + 1][1] - slope_point[slope_no][1];
		var ev = slope_point[slope_no][1] +
			(ch - slope_point[slope_no][0]) * (slope_ev_diff / slope_ch_diff);
		return ev;
	};
	var ev2ch = function(ev) {
		var slope_no = slope_point.length - 2;
		for(var s = 0; s < slope_point.length - 1; s++) {
			if(ev <= slope_point[s + 1][1]) {
				slope_no = s;
				break;
			}
		}
		var slope_ch_diff = slope_point[slope_no + 1][0] - slope_point[slope_no][0];
		var slope_ev_diff = slope_point[slope_no + 1][1] - slope_point[slope_no][1];
		var ch = slope_point[slope_no][0] +
			(ev - slope_point[slope_no][1]) * (slope_ch_diff / slope_ev_diff);
		ch = Math.floor(ch);
		if(ch < 0)
			ch = 0;
		return ch;
	};
	
	
	var additional_sp_info_html = '';
	
	
	if(file_comment.match(/^ *\[#([^\]]+)\]/)) {
		var ext = RegExp.$1;
		
		var filename = file.replace(/\..*$/, "");
		
		additional_sp_info_html += '<div><img src="' + filename + '.' + ext + '"><br><br></div>';
	}
	
	
	
	var data = [];
	var sp_info = sp_info_gps(file_comment);
	var cur_ch = 0;
	var time;
	var peak_info = [];
	
	for(var ch = 0; ch < spectrum_channel; ch++) {
		data.push([ch, parseInt(lines[spectrum_start_lineno + ch])]);
	}
	time = parseFloat(lines[5]);		// 4: real time, 5: live time
	
	sp_info.push(["測定時間(実時間)", lines[4] + "秒"]);
	sp_info.push(["測定時間(LiveTime)", lines[5] + "秒"]);
	
	// 追加情報
	sp_info.push(["測定器名称", lines[1]]);
	sp_info.push(["採取地", lines[isotope_start_lineno - 7]]);
	sp_info.push(["試料名称", lines[isotope_start_lineno - 4]]);
	sp_info.push(["備考", lines[isotope_start_lineno - 1]]);
	sp_info.push(["計測日時", lines[isotope_start_lineno - 6]]);
	sp_info.push(["基準日時", lines[isotope_start_lineno - 5]]);
	
//	var pastsecond = 0;
//	if(lines[isotope_start_lineno - 5].match(/^([0-9]{4})\/([0-9]{2})\/([0-9]{2}) ([0-9]{2}):([0-9]{2}):([0-9]{2})$/)) {
//		var startdate = new Date(parseInt(RegExp.$1), parseInt(RegExp.$2) - 1, parseInt(RegExp.$3),
//			parseInt(RegExp.$4), parseInt(RegExp.$5), parseInt(RegExp.$6));
//		if(lines[isotope_start_lineno - 6].match(/^([0-9]{4})\/([0-9]{2})\/([0-9]{2}) ([0-9]{2}):([0-9]{2}):([0-9]{2})$/)) {
//			var enddate = new Date(parseInt(RegExp.$1), parseInt(RegExp.$2) - 1, parseInt(RegExp.$3),
//				parseInt(RegExp.$4), parseInt(RegExp.$5), parseInt(RegExp.$6));
//			
//			pastsecond = (enddate - startdate) / 1000;
//		}
//	}
	
	var sample_g = parseFloat(lines[isotope_start_lineno - 3]);
	sp_info.push(["試料質量(g)", lines[isotope_start_lineno - 3]]);
	sp_info.push(["試料体積(cm<sup>3</sup>)", lines[isotope_start_lineno - 2]]);
	sp_info.push(["試料密度(g/cm<sup>3</sup>)", (parseFloat(lines[isotope_start_lineno - 3])/parseFloat(lines[isotope_start_lineno - 2])).toFixed(4)]);
	
	
	
	// 核種情報
	additional_sp_info_html += '<table class="csv">';
	additional_sp_info_html += '<tr>';
	additional_sp_info_html += '<th>ID</th>';
	additional_sp_info_html += '<th>keV</th>';
	additional_sp_info_html += '<th>L%</th>';
	additional_sp_info_html += '<th>H%</th>';
	additional_sp_info_html += '<th>bq/kg/cps</th>';
//	additional_sp_info_html += '<th>密度係数</th>';
	additional_sp_info_html += '<th>ネットカウント数</th>';
	additional_sp_info_html += '<th>ネットcps</th>';
//	additional_sp_info_html += '<th>Bq/kg(概算)</th>';
	additional_sp_info_html += '</tr>';
	
	var halflife = [
		8.05 * 24 * 3600,
		30 * 365.2422 * 24 * 3600,
		2.05 * 365.2422 * 24 * 3600,
		1.29e9 * 365.2422 * 24 * 3600
	];
	
	for(var iso = 0; iso < 4; iso++) {
		var isotope    = lines[isotope_start_lineno + iso * 9 + 0];
		var kev_center = parseFloat(lines[isotope_start_lineno + iso * 9 + 1]);
		var kev_l      = parseFloat(lines[isotope_start_lineno + iso * 9 + 2]);
		var kev_h      = parseFloat(lines[isotope_start_lineno + iso * 9 + 3]);
		var bq_kg_cps  = parseFloat(lines[isotope_start_lineno + iso * 9 + 4]);
//		var density    = parseFloat(lines[isotope_start_lineno + iso * 9 + 5]);
		var net_count  = parseFloat(lines[isotope_start_lineno + iso * 9 + 5]);
		var net_cps    = parseFloat(lines[isotope_start_lineno + iso * 9 + 5]);
		
		
		var from = ev2ch(kev_center - kev_center * kev_l / 100);
		var to   = ev2ch(kev_center + kev_center * kev_h / 100);
		peak_info[iso] = [from, to];
		
		var net_count = 0;
		for(var ch = from; ch <= to; ch++) {
			net_count += data[ch][1];
		}
		var net_cps = net_count / time;
		var bq_kg = net_cps * bq_kg_cps * (1000 / sample_g);
		
//		var half_coef = 1 / Math.pow(1/2, pastsecond/halflife[iso]);
		
		additional_sp_info_html += '<tr id="isotope_' + iso + '"><th>' + isotope
			+ '</th><td style="text-align: right;">' + kev_center
			+ '</th><td style="text-align: right;">' + kev_l
			+ '</td><td style="text-align: right;">' + kev_h
			+ '</td><td style="text-align: right;">' + bq_kg_cps
//			+ '</td><td style="text-align: right;">' + density
			+ '</td><td style="text-align: right;">' + net_count
			+ '</td><td style="text-align: right;">' + net_cps.toFixed(4)
//			+ '</td><td style="text-align: right;">' + bq_kg.toFixed(2)
//			+ '</td><td style="text-align: right;">' + half_coef.toFixed(4)
			+ '</td></tr>';
		
	}
	additional_sp_info_html += '</table>';
	
	
	if(data.length == 0 || !time) {
		return false;
	}
	
	var spectrum_data_ch = [];
	var spectrum_data_ev = [];
	
	var min_count = find_min_count(data);
	for(var i in data) {
		spectrum_data_ch.push([data[i][0], data[i][1]]);
		spectrum_data_ev.push([ch2ev(data[i][0]), data[i][1]]);
	}
	
	var additional_html_callback = function() {
		for(var isotope in peak_info) {
			(function(i) {
				$("#isotope_" + i).bind('mouseenter', function() {
					$(this).css('background', '#ffdddd');
					
					plot.setSelection({
						xaxis: {
							from: peak_info[i][0],
							to: peak_info[i][1]
						}
					});
					
				}).bind('mouseleave', function() {
					$(this).css('background', '');
					
					plot.clearSelection();
					graph_clear_marking();
				});
			})(isotope);
		}
	};
	
	var spectrum = {
		file: file,
		file_comment: file_comment,
		sp_info: sp_info,
		additional_sp_info_html: additional_sp_info_html,
		additional_html_callback: additional_html_callback,
		time: time,
		min_cps: min_count / time,
		spectrum_data_ch: convert_count2cps(time, spectrum_data_ch),
		spectrum_data_ev: convert_count2cps(time, spectrum_data_ev),
		without_bg: true
	};
	return spectrum;
}

function draw_graph_emf211b_spectrum(file, file_comment, data) {
	var lines = split_line(data);
	
	// フォーマットのチェック
	if(! lines[0].match(/^FileVersion=[123]\./)) {
		return false;
	}
	
	// エネルギー校正ポイント
	var slope_point_spe = [
		[0, 352.0],
		[0, 609.0],
		[0, 661.7],
		[0, 1120.0],
		[0, 1460.8],
		[0, 1765.0]
	];
	var slope_point_bg = [
		[0, 352.0],
		[0, 609.0],
		[0, 661.7],
		[0, 1120.0],
		[0, 1460.8],
		[0, 1765.0]
	];
	var data = {};
	data['SPE'] = [];
	data['BG'] = [];
	data['DIFF'] = [];
	var time;
	var time_bg;
	var sp_info = sp_info_gps(file_comment);
	var sp_info_bg = [];
	
	var isotope_info = {};
	isotope_info['エネルギー中心位置'] = [];
	isotope_info['エネルギー位置左幅'] = [];
	isotope_info['エネルギー位置右幅'] = [];
	isotope_info['換算係数'] = [];
	
	for(var i = 0; i < lines.length; i++) {
		if(lines[i].match(/^BG積算時間1=(.*)$/)) {
			sp_info_bg.push(["BG積算時間", RegExp.$1]);
		}
		if(lines[i].match(/^分析容器タイプ=(.*)$/)) {
			sp_info.push(["分析容器タイプ", RegExp.$1]);
		}
		if(lines[i].match(/^バックグラウンドの選択=(.*)$/)) {
			sp_info.push(["バックグラウンドの選択", RegExp.$1]);
		}
		if(lines[i].match(/^計測波形の移動平均幅=(.*)$/)) {
			sp_info.push(["計測波形の移動平均幅", RegExp.$1]);
		}
		if(lines[i].match(/^減衰基準日時=(.*)$/)) {
			sp_info.push(["減衰基準日時", RegExp.$1]);
		}
		if(lines[i].match(/^質量=(.*)$/)) {
			sp_info.push(["質量", RegExp.$1]);
		}
		if(lines[i].match(/^体積=(.*)$/)) {
			sp_info.push(["体積", RegExp.$1]);
		}
		if(lines[i].match(/^備考=(.*)$/)) {
			sp_info.push(["備考", RegExp.$1]);
		}
		if(lines[i].match(/^容器タイプ=(.*)$/)) {
			sp_info.push(["容器タイプ", RegExp.$1]);
		}
		if(lines[i].match(/^担当者=(.*)$/)) {
			sp_info.push(["担当者", RegExp.$1]);
		}
		if(lines[i].match(/^採取日時=(.*)$/)) {
			sp_info.push(["採取日時", RegExp.$1]);
		}
		if(lines[i].match(/^計測開始時間=(.*)$/)) {
			sp_info.push(["計測開始時間", RegExp.$1]);
		}
		if(lines[i].match(/^採取地=(.*)$/)) {
			sp_info.push(["採取地", RegExp.$1]);
		}
		if(lines[i].match(/^試料名称=(.*)$/)) {
			sp_info.push(["試料名称", RegExp.$1]);
		}
		if(lines[i].match(/^試料番号=(.*)$/)) {
			sp_info.push(["試料番号", RegExp.$1]);
		}
		if(lines[i].match(/^BGチャンネル位置([0-9]+)=([0-9]+)$/)) {
			slope_point_bg[parseInt(RegExp.$1) - 1][0] = parseInt(RegExp.$2);
		}
		if(lines[i].match(/^チャンネル位置([0-9]+)=([0-9]+)$/)) {
			slope_point_spe[parseInt(RegExp.$1) - 1][0] = parseInt(RegExp.$2);
		}
		if(lines[i].match(/^BG波高データ1=([0-9;]+)$/)) {
			var spectrum_data = (RegExp.$1).split(";");
			for(var ch = 0; ch < spectrum_data.length; ch++) {
				data['BG'].push([ch, parseInt(spectrum_data[ch])]);
			}
		}
		if(lines[i].match(/^波高データ1=([0-9;]+)$/)) {
			var spectrum_data = (RegExp.$1).split(";");
			for(var ch = 0; ch < spectrum_data.length; ch++) {
				data['SPE'].push([ch, parseInt(spectrum_data[ch])]);
			}
		}
		if(lines[i].match(/^濃度計測結果：波高データ=([\-0-9;]+)$/)) {
			var spectrum_data = (RegExp.$1).split(";");
			for(var ch = 0; ch < spectrum_data.length; ch++) {
				data['DIFF'].push([ch, parseInt(spectrum_data[ch])]);
			}
		}
		if(lines[i].match(/^BG計測時間=([0-9]+)$/)) {
			time_bg = parseFloat(RegExp.$1);
		}
		if(lines[i].match(/^計測時間\(秒\)=([0-9]+)$/)) {
			time = parseFloat(RegExp.$1);
		}
		if(lines[i].match(/^濃度計測結果：濃度=([0-9\.;]+)$/)) {
			isotope_info['濃度'] = (RegExp.$1).split(";");
		}
		if(lines[i].match(/^濃度計測不確かさ=([0-9\.;]+)$/)) {
			isotope_info['不確かさ'] = (RegExp.$1).split(";");
		}
		if(lines[i].match(/^濃度計測結果：ネットレート=([0-9\.;]+)$/)) {
			isotope_info['ネットレート'] = (RegExp.$1).split(";");
		}
		if(lines[i].match(/^濃度計測結果：減衰補正=([0-9\.;]+)$/)) {
			isotope_info['減衰補正'] = (RegExp.$1).split(";");
		}
		if(lines[i].match(/^濃度計測結果：質量補正=([0-9\.;]+)$/)) {
			isotope_info['質量補正'] = (RegExp.$1).split(";");
		}
		if(lines[i].match(/^濃度計測結果：最小検出限界=([0-9\.;]+)$/)) {
			isotope_info['最小検出限界'] = (RegExp.$1).split(";");
		}
		if(lines[i].match(/^エネルギー中心位置([0-9]+)=([0-9]+)$/)) {
			isotope_info['エネルギー中心位置'][parseInt(RegExp.$1) - 1] = parseInt(RegExp.$2);
		}
		if(lines[i].match(/^エネルギー位置左幅([0-9]+)=([0-9\.]+)$/)) {
			isotope_info['エネルギー位置左幅'][parseInt(RegExp.$1) - 1] = parseFloat(RegExp.$2);
		}
		if(lines[i].match(/^エネルギー位置右幅([0-9]+)=([0-9\.]+)$/)) {
			isotope_info['エネルギー位置右幅'][parseInt(RegExp.$1) - 1] = parseFloat(RegExp.$2);
		}
		if(lines[i].match(/^I-131換算係数=([0-9\.]+)$/)) {
			isotope_info['換算係数'][0] = RegExp.$1;
		}
		if(lines[i].match(/^Cs-137換算係数=([0-9\.]+)$/)) {
			isotope_info['換算係数'][1] = RegExp.$1;
		}
		if(lines[i].match(/^Cs-134換算係数=([0-9\.]+)$/)) {
			isotope_info['換算係数'][2] = RegExp.$1;
		}
		if(lines[i].match(/^K-40換算係数=([0-9\.]+)$/)) {
			isotope_info['換算係数'][3] = RegExp.$1;
		}
	}
	
	
	if(data['BG'].length == 0 || !time_bg) {
		return false;
	}
	sp_info.push(["計測時間", time + " 秒"]);
	sp_info_bg.push(["計測時間", time_bg + " 秒"]);
	
	
	var ch2ev = function(slope_point, ch) {
		var slope_no = slope_point.length - 2;
		for(var s = 0; s < slope_point.length - 1; s++) {
			if(ch <= slope_point[s + 1][0]) {
				slope_no = s;
				break;
			}
		}
		var slope_ch_diff = slope_point[slope_no + 1][0] - slope_point[slope_no][0];
		var slope_ev_diff = slope_point[slope_no + 1][1] - slope_point[slope_no][1];
		var ev = slope_point[slope_no][1] +
			(ch - slope_point[slope_no][0]) * (slope_ev_diff / slope_ch_diff);
		return ev;
	};
	var ev2ch = function(slope_point, ev) {
		var slope_no = slope_point.length - 2;
		for(var s = 0; s < slope_point.length - 1; s++) {
			if(ev <= slope_point[s + 1][1]) {
				slope_no = s;
				break;
			}
		}
		var slope_ch_diff = slope_point[slope_no + 1][0] - slope_point[slope_no][0];
		var slope_ev_diff = slope_point[slope_no + 1][1] - slope_point[slope_no][1];
		var ch = slope_point[slope_no][0] +
			(ev - slope_point[slope_no][1]) * (slope_ch_diff / slope_ev_diff);
		ch = Math.floor(ch);
		if(ch < 0)
			ch = 0;
		return ch;
	};
	
	var additional_sp_info_html = '';
	
//	if(file_comment.match(/^ *\[#([^\]]+)\]/)) {
//		var ext = RegExp.$1;
//		var filename = file.replace(/\..*$/, "");
//		additional_sp_info_html += '<div><img src="' + filename + '.' + ext + '"><br><br></div>';
//	}
	
	if(isotope_info['濃度']) {
		// 核種情報
		additional_sp_info_html += '<table class="csv">';
		additional_sp_info_html += '<tr>';
		additional_sp_info_html += '<th>核種</th>';
		additional_sp_info_html += '<th>keV</th>';
		additional_sp_info_html += '<th>L%</th>';
		additional_sp_info_html += '<th>H%</th>';
		additional_sp_info_html += '<th>放射能濃度</th>';
		additional_sp_info_html += '<th>不確かさ(±3σ)</th>';
		additional_sp_info_html += '<th>測定下限値(3σ)</th>';
		additional_sp_info_html += '<th>換算係数</th>';
		additional_sp_info_html += '<th>質量補正</th>';
		additional_sp_info_html += '<th>減衰補正</th>';
		additional_sp_info_html += '<th>ネットレート</th>';
		additional_sp_info_html += '</tr>';
		
		var isotope_list = ['I-131', 'Cs-137', 'Cs-134', 'K-40'];
		var peak_info = [];
		for(var iso = 0; iso < 4; iso++) {
			var isotope    = isotope_list[iso];
			
			var kev_center = isotope_info['エネルギー中心位置'][iso];
			var kev_l      = isotope_info['エネルギー位置左幅'][iso];
			var kev_h      = isotope_info['エネルギー位置右幅'][iso];
			
			var from = ev2ch(slope_point_spe, kev_center - kev_center * kev_l / 100);
			var to   = ev2ch(slope_point_spe, kev_center + kev_center * kev_h / 100);
			peak_info[iso] = [from, to];
			
			additional_sp_info_html += '<tr id="isotope_' + iso + '"><th>' + isotope
				+ '</th><td style="text-align: right;">' + kev_center
				+ '</th><td style="text-align: right;">' + kev_l
				+ '</td><td style="text-align: right;">' + kev_h
				+ '</td><td style="text-align: right;">' + round_to_fixed(2, parseFloat(isotope_info['濃度'][iso]))
				+ '</td><td style="text-align: right;">' + round_to_fixed(3, parseFloat(isotope_info['不確かさ'][iso]))
				+ '</td><td style="text-align: right;">' + round_to_fixed(3, parseFloat(isotope_info['最小検出限界'][iso]))
				+ '</td><td style="text-align: right;">' + round_to_fixed(3, parseFloat(isotope_info['換算係数'][iso]))
				+ '</td><td style="text-align: right;">' + round_to_fixed(3, parseFloat(isotope_info['質量補正'][iso]))
				+ '</td><td style="text-align: right;">' + round_to_fixed(3, parseFloat(isotope_info['減衰補正'][iso]))
				+ '</td><td style="text-align: right;">' + round_to_fixed(3, parseFloat(isotope_info['ネットレート'][iso]))
				+ '</td></tr>';
			
		}
		additional_sp_info_html += '</table>';
	}
	
	var additional_html_callback = function() {
		for(var isotope in peak_info) {
			(function(i) {
				$("#isotope_" + i).bind('mouseenter', function() {
					$(this).css('background', '#ffdddd');
					
					plot.setSelection({
						xaxis: {
							from: peak_info[i][0],
							to: peak_info[i][1]
						}
					});
					
				}).bind('mouseleave', function() {
					$(this).css('background', '');
					
					plot.clearSelection();
					graph_clear_marking();
				});
			})(isotope);
		}
	};
	
	
	var spectrum_data_ch = {};
	var spectrum_data_ev = {};
	
	for(var name in data) {
		spectrum_data_ch[name] = [];
		spectrum_data_ev[name] = [];
		var slope_point = slope_point_spe;
		if(name == 'BG') {
			slope_point = slope_point_bg;
		}
		for(var i in data[name]) {
			spectrum_data_ch[name].push([data[name][i][0], data[name][i][1]]);
			spectrum_data_ev[name].push([ch2ev(slope_point, data[name][i][0]), data[name][i][1]]);
		}
	}
	
	var spectrum;
	if(!time) {
		// BGのみしかない
		spectrum = {
			data: [{
				file: file,
				file_comment: file_comment,
				name: 'BG',
				sp_info: sp_info_bg,
				time: time,
				min_cps: find_min_count(spectrum_data_ch['BG']) / time_bg,
				spectrum_data_ch: convert_count2cps(time_bg, spectrum_data_ch['BG']),
				spectrum_data_ev: convert_count2cps(time_bg, spectrum_data_ev['BG'])
			}]
		};
	} else {
		spectrum = {
			data: [{
				file: file,
				file_comment: file_comment,
				name: 'SPE',
				sp_info: sp_info,
				additional_sp_info_html: additional_sp_info_html,
				additional_html_callback: additional_html_callback,
				time: time,
				min_cps: find_min_count(spectrum_data_ch['SPE']) / time,
				spectrum_data_ch: convert_count2cps(time, spectrum_data_ch['SPE']),
				spectrum_data_ev: convert_count2cps(time, spectrum_data_ev['SPE'])
			}, {
				file: file,
				file_comment: file_comment,
				name: 'BG',
				sp_info: sp_info_bg,
				time: time,
				min_cps: find_min_count(spectrum_data_ch['BG']) / time_bg,
				spectrum_data_ch: convert_count2cps(time_bg, spectrum_data_ch['BG']),
				spectrum_data_ev: convert_count2cps(time_bg, spectrum_data_ev['BG'])
			}, {
				file: file,
				file_comment: file_comment,
				name: 'DIFF',
				sp_info: sp_info,
				additional_sp_info_html: additional_sp_info_html,
				additional_html_callback: additional_html_callback,
				time: time,
				min_cps: find_min_count(spectrum_data_ch['DIFF']) / time,
				spectrum_data_ch: convert_count2cps(time, spectrum_data_ch['DIFF']),
				spectrum_data_ev: convert_count2cps(time, spectrum_data_ev['DIFF']),
				without_bg: true
			}]
		};
	}
	return spectrum;
}

function draw_graph_at1320_spectrum(file, file_comment, data) {
	var lines = split_line(data);
	
	// フォーマットのチェック
	var i = 24;
	if(! lines[0].match(/^ATOMTEXSPECTRUM =/)) {
		return false;
	}
	
	var additional_sp_info_html = '';
	
	if(file_comment.match(/^ *\[#([^\]]+)\]/)) {
		var ext = RegExp.$1;
		
		var filename = file.replace(/\..*$/, "");
		
		additional_sp_info_html += '<div><img src="' + filename + '.' + ext + '"><br><br></div>';
	}
	
	
	var data = [];
	var sp_info = sp_info_gps(file_comment);
	var bg_sp_info = [];
	var time;
	var bg_time;
	var peak_info = {};
	var ev_info = [];
	
	var spectrum_data_ch = [];
	var spectrum_data_ev = [];
	var bg_spectrum_data_ch = [];
	var bg_spectrum_data_ev = [];
	
	for(var i = 0; i < lines.length; i++) {
		
		if(lines[i].match(/^ATOMTEXSPECTRUM = (.*)$/)) {
			sp_info.push(["測定No.", RegExp.$1]);
		}
		if(lines[i].match(/^TIME = (.*)$/)) {
			time = parseFloat(RegExp.$1);
			sp_info.push(["測定時間", RegExp.$1 + "秒"]);
		}
		if(lines[i].match(/^BGNDTIME = (.*)$/)) {
			bg_time = parseFloat(RegExp.$1);
			bg_sp_info.push(["測定時間", RegExp.$1 + "秒"]);
		}
		if(lines[i].match(/^REMARK = (.*)$/)) {
			sp_info.push(["試料情報", RegExp.$1]);
		}
		if(lines[i].match(/^WEIGHT = (.*)$/)) {
			sp_info.push(["試料重量", RegExp.$1 + "g"]);
		}
		if(lines[i].match(/^DATE = (.*)$/)) {
			sp_info.push(["測定日時", RegExp.$1]);
		}
		if(lines[i].match(/^DU_TYPE = (.*)$/)) {
			sp_info.push(["試料容器", RegExp.$1]);
		}
		if(lines[i].match(/^TEMPERATURE = (.*)$/)) {
			sp_info.push(["温度", RegExp.$1 + "℃"]);
		}
		if(lines[i].match(/^COMMENT = *(.*)$/)) {
			sp_info.push(["コメント", RegExp.$1]);
		}
		if(lines[i].match(/^ECALIBRATION = (.*)$/)) {
			var max_ch = parseInt(RegExp.$1);
			var max_ev = 0;
			for(var ch = 0; ch < max_ch; ch++) {
				var ev = parseFloat(lines[i+1+ch]);
				if(max_ev < ev)
					max_ev = ev;
				ev_info[ch] = max_ev;
			}
		}
		if(lines[i].match(/^SPECTR = (.*)$/)) {
			var max_ch = parseInt(RegExp.$1);
			for(var ch = 0; ch < max_ch; ch++) {
				var val = parseFloat(lines[i+1+ch]);
				spectrum_data_ch.push([ch, val]);
				spectrum_data_ev.push([ev_info[ch], val]);
			}
		}
		if(lines[i].match(/^BGNDSPECTR = (.*)$/)) {
			var max_ch = parseInt(RegExp.$1);
			for(var ch = 0; ch < max_ch; ch++) {
				var val = parseFloat(lines[i+1+ch]);
				bg_spectrum_data_ch.push([ch, val]);
				bg_spectrum_data_ev.push([ev_info[ch], val]);
			}
		}
		
	}
	
	if(!time) {
		return false;
	}
	
	var min_count = find_min_count(spectrum_data_ch);
	var bg_min_count = find_min_count(bg_spectrum_data_ch);
	
	var spectrum = {
		file: file,
		file_comment: file_comment,
		sp_info: sp_info,
		time: time,
		min_cps: min_count / time,
		spectrum_data_ch: convert_count2cps(time, spectrum_data_ch),
		spectrum_data_ev: convert_count2cps(time, spectrum_data_ev)
	};
	
	var spectrums = {
		data: [{
			name: 'SPE',
			file: file,
			file_comment: file_comment,
			sp_info: sp_info,
			time: time,
			min_cps: min_count / time,
			spectrum_data_ch: convert_count2cps(time, spectrum_data_ch),
			spectrum_data_ev: convert_count2cps(time, spectrum_data_ev)
		}, {
			name: 'BG',
			file: file,
			file_comment: file_comment,
			sp_info: bg_sp_info,
			time: bg_time,
			min_cps: bg_min_count / bg_time,
			spectrum_data_ch: convert_count2cps(bg_time, bg_spectrum_data_ch),
			spectrum_data_ev: convert_count2cps(bg_time, bg_spectrum_data_ev)
		}]
	};
	
	// 1ファイルのみロード時は同名のcsvファイルの読み込みをトライ
	if(typeof file == "string") {
		var csvfilename = file.replace(/\.ats$/i, ".csv");
		if(csvfilename != file) {
			var csvdata = '';
			$.ajax({
				async: false,
				cache: false,
				dataType: "text",
				url: csvfilename,
				beforeSend: function(xhr) {
					xhr.overrideMimeType("text/html; charset=UTF-8");
				},
				error: function(jqXHR, textStatus, errorThrown) {
					// ok
				},
				success: function(data, textStatus, jqXHR) {
					csvdata = data;
				}
			});
			if(csvdata != '') {
				var additional_sp_info_html = '';
				additional_sp_info_html += '<table class="csv">';
				additional_sp_info_html += '<tr><th>核種</th><th>判定</th><th>放射能濃度</th><th>Relative error</th><th>Absolute error</th><th>Statistical error</th></tr>';
				
				var csvlines = split_line(csvdata);
				for(var i = 3; i < csvlines.length; i++) {
					var fields = csvlines[i].split(",");
					if(fields.length == 7) {
						additional_sp_info_html += '<tr id="isotope_' + fields[1] + '"><th>' + fields[1]
							+ '</th><td style="text-align: right;">' + fields[0]
							+ '</td><td style="text-align: right;">' + fields[2] + " " + fields[6]
							+ '</td><td style="text-align: right;">' + fields[3]
							+ '</td><td style="text-align: right;">' + fields[4]
							+ '</td><td style="text-align: right;">' + fields[5]
							+ '</td></tr>';
					}
				}
				
				additional_sp_info_html += '</table>';
				
				spectrums['data'][0]['additional_sp_info_html'] = additional_sp_info_html;
			}
		}
	}
	return spectrums;
}

function draw_graph_lb2045_spectrum(file, file_comment, data) {
	var lines = split_line(data);
	
	// フォーマットのチェック
	var is_lb2045_file;
	for(var i = 0; i < lines.length; i++) {
		if(lines[i].match(/^ +LB 2045/)) {
			is_lb2045_file = true;
			break;
		}
	}
	if(!is_lb2045_file) {
		return false;
	}
	
	var additional_sp_info_html = '';
	var sp_info = sp_info_gps(file_comment);
	var cur_ch = 0;
	var cur_ch_bg = 0;
	var data = [];
	var data_bg = [];
	var time;
	var ev_range;
	var region_info;
	var isotope_no = 0;
	var mode = 'info';
	for(var i = 0; i < lines.length; i++) {
		if(mode == 'info') {
			if(lines[i].match(/^Meas. Time \[s\] *: *([0-9]+)$/)) {
				time = parseInt(RegExp.$1);
				sp_info.push(["測定時間", time + "秒"]);
				if(lines[i+1].match(/^ *([0-9]+\. .*[0-9]{2}:[0-9]{2}:[0-9]{2})/)) {
					sp_info.push(["測定日時", RegExp.$1]);
				}
				if(lines[i+2].match(/^ *([0-9]+\. .*[0-9]{2}:[0-9]{2}:[0-9]{2})/)) {
					sp_info.push(["測定日時", RegExp.$1]);
				}
			}
			if(lines[i].match(/^Bkg MeasTime \[s\] *: *([0-9]+)$/)) {
				sp_info.push(["BG測定時間", RegExp.$1 + "秒"]);
			}
			if(lines[i].match(/^Energy Range \[keV\] *: *([0-9]+)$/)) {
				ev_range = parseInt(RegExp.$1);
				sp_info.push(["エネルギーレンジ", ev_range + "keV"]);
			}
			if(lines[i].match(/^Sample Name *: *([^ ]+)/)) {
				sp_info.push(["サンプル名", RegExp.$1]);
			}
			if(lines[i].match(/^Sample Weight \[kg\]: *([^ ]+)/)) {
				sp_info.push(["試料重量", RegExp.$1 + "kg"]);
			}
			if(lines[i].match(/Dead Time \[%\] *: *([^ ]+)$/)) {
				sp_info.push(["デッドタイム", RegExp.$1 + "%"]);
			}
			if(lines[i].match(/Dead Time Loss \[%\] *: *([^ ]+)$/)) {
				sp_info.push(["デッドタイムロス", RegExp.$1 + "%"]);
			}
			if(lines[i].match(/Spillover Factor *: *([^ ]+)$/)) {
				sp_info.push(["スピルオーバー係数", RegExp.$1]);
			}
			if(lines[i].match(/Program Version *: *(.+)$/)) {
				sp_info.push(["プログラムバージョン", RegExp.$1]);
			}
			if(lines[i].match(/^Fill Volume \[%\] *: *(.+)$/)) {
				sp_info.push(["充填率", RegExp.$1 + "%"]);
			}
			if(lines[i].match(/^COMMENT *: *(.+)$/)) {
				sp_info.push(["コメント", RegExp.$1]);
			}
			if(lines[i].match(/^Spectrum Values *:/) || lines[i].match(/^Spectrum Values \[cps\]:/)) {
				mode = 'spectrum';
			}
			if(lines[i].match(/^Nuclide   Raw Data .*MDA.*Unit$/)) {
				mode = 'nuclide';
			}
			// Cs/Kg K40/cps の表記前提で解析
			if(lines[i].match(/^Region of Interest: *([0-9]+) *- *([0-9]+) *keV *([0-9]+) *- *([0-9]+) *keV/)) {
				region_info = [
					[parseInt(RegExp.$1),parseInt(RegExp.$2)],
					[parseInt(RegExp.$3),parseInt(RegExp.$4)]
				];
			}
		} else if(mode == 'nuclide') {
			if(lines[i].match(/^$/)) {
				if(additional_sp_info_html != "") {
					additional_sp_info_html += '</table>';
				}
				mode = 'info';
			}
			if(lines[i].match(/^(Cs\/Kg|K40\/cps)/)) {
				var field = lines[i].split(/ +/);
				
				if(additional_sp_info_html == "") {
					additional_sp_info_html += '<table class="csv">';
					additional_sp_info_html += '<tr>';
					additional_sp_info_html += '<th>Nuclide</th>';
					additional_sp_info_html += '<th>Raw Data</th>';
					additional_sp_info_html += '<th>Result</th>';
					additional_sp_info_html += '<th>Uncertainty</th>';
					additional_sp_info_html += '<th>MDA</th>';
					additional_sp_info_html += '<th>Unit</th>';
					additional_sp_info_html += '</tr>';
				}
				additional_sp_info_html += '<tr id="isotope_' + isotope_no + '">';
				additional_sp_info_html += '<td>' + field[0] + '</td>';
				additional_sp_info_html += '<td style="text-align: right;">' + field[1] + '</td>';
				var status = '';
				if(parseFloat(field[2]) < parseFloat(field[4])) {
					status = '<br><font size="-2">検出限界未満</font>';
				}
				additional_sp_info_html += '<td style="text-align: right;">' + field[2] + status + '</td>';
				additional_sp_info_html += '<td style="text-align: right;">' + field[3] + '</td>';
				additional_sp_info_html += '<td style="text-align: right;">' + field[4] + '</td>';
				additional_sp_info_html += '<td style="text-align: right;">' + field[5] + '</td>';
				additional_sp_info_html += '</tr>';
				
				isotope_no++;
			}
		} else if(mode == 'spectrum') {
			if(lines[i].match(/^Base Values *:/)) {
				mode = 'background';
			}
			if(lines[i].match(/^ *([0-9\.]+);$/)) {
				data.push([cur_ch++, parseFloat(RegExp.$1) * time]);
			}
		} else if(mode == 'background') {
			if(lines[i].match(/^ *([0-9\.]+);$/)) {
				data_bg.push([cur_ch_bg++, parseFloat(RegExp.$1) * time]);
			}
		}
	}
	
	
	if(data.length == 0 || !time) {
		return false;
	}
	
	var make_data = function(name, ch, spe_data) {
		var spectrum_data_ch = [];
		var spectrum_data_ev = [];
		
		var min_count = find_min_count(spe_data);
		for(var i in spe_data) {
			spectrum_data_ch.push([spe_data[i][0], spe_data[i][1]]);
			spectrum_data_ev.push([spe_data[i][0] * (ev_range / ch), spe_data[i][1]]);
		}
		
		var additional_html_callback = function() {
			if(isotope_no == 2 && region_info.length == 2) {
				for(var isotope = 0; isotope < 2; isotope++) {
					(function(i) {
						$("#isotope_" + i).bind('mouseenter', function() {
							$(this).css('background', '#ffdddd');
							
							plot.setSelection({
								xaxis: {
									from: region_info[i][0] * (ch / ev_range),
									to: region_info[i][1] * (ch / ev_range)
								}
							});
							
						}).bind('mouseleave', function() {
							$(this).css('background', '');
							
							plot.clearSelection();
							graph_clear_marking();
						});
					})(isotope);
				}
			}
		};
		
		var spectrum = {
			name: name,
			file: file,
			file_comment: file_comment,
			sp_info: sp_info,
			additional_sp_info_html: additional_sp_info_html,
			additional_html_callback: additional_html_callback,
			time: time,
			min_cps: min_count / time,
			spectrum_data_ch: convert_count2cps(time, spectrum_data_ch),
			spectrum_data_ev: convert_count2cps(time, spectrum_data_ev)
		};
		return spectrum;
	};
	
	var spectrums = {
		data: [make_data('SPE', cur_ch, data)]
	};
	
	if(cur_ch_bg != 0) {
		spectrums['data'].push(make_data('BG', cur_ch_bg, data_bg));
	}
	
	return spectrums;
}

function draw_graph_canberra_gc2020_spectrum(file, file_comment, data) {
	var lines = split_line(data);
	
	// フォーマットのチェック
	if(lines[0] != "<MEASURE>") {
		return false;
	}
	
	var sp_info = sp_info_gps(file_comment);
	var cur_ch = 0;
	var data = [];
	var time;
	var ev_slope = [];
	var region_info;
	var nuclide_info_dat = [];
	var nuclide_info_act = [];
	var nuclide_info_peak = [];
	var mode = '';
	for(var i = 0; i < lines.length; i++) {
		if(lines[i].match(/^<(.+)>$/)) {
			mode = RegExp.$1;
			continue;
		}
		if(mode == 'MEASURE') {
			if(lines[i].match(/^LIVETIME=([0-9\.]+)$/)) {
				time = parseFloat(RegExp.$1);
				sp_info.push(["測定時間(Live)", time + "秒"]);
			}
			if(lines[i].match(/^REALTIME=([0-9\.]+)$/)) {
				sp_info.push(["測定時間(Real)", RegExp.$1 + "秒"]);
			}
			if(lines[i].match(/^ACQDATE=(.*)$/)) {
				sp_info.push(["測定日時", RegExp.$1]);
			}
			if(lines[i].match(/^COMMENT=(.*)$/)) {
				sp_info.push(["コメント", RegExp.$1]);
			}
			if(lines[i].match(/^POSNAME=(.*)$/)) {
				sp_info.push(["測定位置", RegExp.$1]);
			}
		} else if(mode == 'SAMPLE') {
			if(lines[i].match(/^SMPGATSTA=(.*)$/)) {
				sp_info.push(["採取開始日時", RegExp.$1]);
			}
			if(lines[i].match(/^SMPGATEND=(.*)$/)) {
				sp_info.push(["採取終了日時", RegExp.$1]);
			}
			if(lines[i].match(/^SMPCODE=(.*)$/)) {
				sp_info.push(["試料コード", RegExp.$1]);
			}
			if(lines[i].match(/^SMPGRP=(.*)$/)) {
				sp_info.push(["試料区分", RegExp.$1]);
			}
			if(lines[i].match(/^VESSEL=(.*)$/)) {
				sp_info.push(["試料容器", RegExp.$1]);
			}
			if(lines[i].match(/^HEIGHT=(.*)$/)) {
				sp_info.push(["充填高さ", RegExp.$1 + " cm"]);
			}
			if(lines[i].match(/^DENSITY=(.*)$/)) {
				sp_info.push(["密度", RegExp.$1 + " g/cm<sup>3</sup>"]);
			}
			if(lines[i].match(/^SMPVOL=(.*)$/)) {
				sp_info.push(["試料量", RegExp.$1]);
			}
			if(lines[i].match(/^SMPVOLUNT=(.*)$/)) {
				sp_info.push(["試料量単位", RegExp.$1]);
			}
			if(lines[i].match(/^MATERIAL=(.*)$/)) {
				sp_info.push(["母材", RegExp.$1]);
			}
		} else if(mode == 'COUNT') {
			var values = lines[i].split(/\s*,\s*/);
			for(var v = 0; v < values.length; v++) {
				data.push([cur_ch++, parseFloat(values[v])]);
			}
		} else if(mode == 'RESULT') {
			if(lines[i].match(/^REN([1-5])=([0-9\.E\-]+)$/)) {
				var no = parseInt(RegExp.$1);
				var val = parseFloat(RegExp.$2);
				ev_slope[no - 1] = val;
			}
			if(lines[i].match(/^ANLCODE=(.*)$/)) {
				sp_info.push(["測定コード", RegExp.$1]);
			}
		} else if(mode == 'RESULTDAT') {
			nuclide_info_dat.push(lines[i].split(","));
		} else if(mode == 'RESULTACT') {
			nuclide_info_act.push(lines[i].split(","));
		} else if(mode == 'RESULTPKS') {
			nuclide_info_peak.push(lines[i].split(","));
		}
	}
	
	if(data.length == 0 || !time || ev_slope.length == 0) {
		return false;
	}
	
	var format_num
	
	var additional_sp_info_html = '';
	
	additional_sp_info_html += '<script>';
	additional_sp_info_html += 'function gs2020_nuclide(no) { for(var n = 1; n <= 3; n++) { $("#gs2020_nuclide" + n).hide(); } $("#gs2020_nuclide" + no).show(); }';
	additional_sp_info_html += '</script>';
	
	additional_sp_info_html += '[<a href="javascript: gs2020_nuclide(1);">核種分析結果１</a>]';
	additional_sp_info_html += '[<a href="javascript: gs2020_nuclide(2);">核種定量結果２</a>]';
	additional_sp_info_html += '[<a href="javascript: gs2020_nuclide(3);">ピーク検索結果</a>]';
	additional_sp_info_html += '<div id="gs2020_nuclide1" style="display: none;">';
	
	additional_sp_info_html += '<table class="csv">';
	additional_sp_info_html += '<tr>';
	additional_sp_info_html += '<th>検出</th>';
	additional_sp_info_html += '<th>核種名</th>';
	additional_sp_info_html += '<th>エネルギー<br>(keV)</th>';
//	additional_sp_info_html += '<th>ピーク面積<br>(counts)</th>';
//	additional_sp_info_html += '<th>検出限界<br>(counts)</th>';
	additional_sp_info_html += '<th>半減期</th>';
	additional_sp_info_html += '<th>放出比<br>(%)</th>';
	additional_sp_info_html += '<th>サム効果<br>補正係数</th>';
	additional_sp_info_html += '<th>自己吸収<br>補正係数</th>';
//	additional_sp_info_html += '<th>減衰補正<br>補正係数</th>';
	additional_sp_info_html += '<th>検出効率<br>(%)</th>';
	additional_sp_info_html += '<th>放射能<br>(Bq/kg)</th>';
	additional_sp_info_html += '<th>荷重平均放射能<br>(Bq/kg)</th>';
	additional_sp_info_html += '<th>検出限界値<br>(Bq/kg)</th>';
//	additional_sp_info_html += '<th>属性</th>';
	additional_sp_info_html += '<th>Mark</th>';
	additional_sp_info_html += '<th>計算方法</th>';
	additional_sp_info_html += '</tr>';
	for(var i = 0; i < nuclide_info_dat.length; i++) {
		additional_sp_info_html += '<tr id="nuclide_info_dat_' + i + '">';
		additional_sp_info_html += '<td style="text-align: center;">' + nuclide_info_dat[i][4] + '</td>';
		additional_sp_info_html += '<td style="text-align: left;">'   + nuclide_info_dat[i][7] + '</td>';
		additional_sp_info_html += '<td style="text-align: right;">'  + Number(nuclide_info_dat[i][8]).toFixed(2) + '</td>';
	//	additional_sp_info_html += '<td style="text-align: right;">'  + 'ピーク面積' + '</td>';
	//	additional_sp_info_html += '<td style="text-align: right;">'  + '検出限界' + '</td>';
		additional_sp_info_html += '<td style="text-align: right;">'  + nuclide_info_dat[i][10] + ' ' + nuclide_info_dat[i][11] + '</td>';
		additional_sp_info_html += '<td style="text-align: right;">'  + Number(nuclide_info_dat[i][9]).toFixed(2) + '</td>';
		additional_sp_info_html += '<td style="text-align: right;">'  + Number(nuclide_info_dat[i][20]).toFixed(6) + '</td>';
		additional_sp_info_html += '<td style="text-align: right;">'  + Number(nuclide_info_dat[i][19]).toFixed(6) + '</td>';
	//	additional_sp_info_html += '<td style="text-align: right;">'  + '減衰補正' + '</td>';
		additional_sp_info_html += '<td style="text-align: right;">'  + (Number(nuclide_info_dat[i][12]) * 100).toFixed(3) + '</td>';
		additional_sp_info_html += '<td style="text-align: right;">'  + (nuclide_info_dat[i][29] == 0 ? Number(nuclide_info_dat[i][24]).toExponential(3) : Number(nuclide_info_dat[i][29]).toExponential(3))
																		+ ' ± ' + (nuclide_info_dat[i][30] == 0 ? Number(nuclide_info_dat[i][25]).toExponential(3) : Number(nuclide_info_dat[i][30]).toExponential(3)) + '</td>';
		var kazyu = '';
		if(nuclide_info_dat[i][46] != 0) {
			kazyu = (nuclide_info_dat[i][48] == 0 ? Number(nuclide_info_dat[i][46]).toExponential(3) : Number(nuclide_info_dat[i][48]).toExponential(3))
						+ ' ± ' + (nuclide_info_dat[i][49] == 0 ? Number(nuclide_info_dat[i][47]).toExponential(3) : Number(nuclide_info_dat[i][49]).toExponential(3));
		}
		additional_sp_info_html += '<td style="text-align: right;">'  + kazyu + '</td>';
		additional_sp_info_html += '<td style="text-align: right;">'  + Number(nuclide_info_dat[i][34]).toExponential(3) + '</td>';
	//	additional_sp_info_html += '<td style="text-align: right;">'  + '属性' + '</td>';
		additional_sp_info_html += '<td style="text-align: center;">' + nuclide_info_dat[i][5] + '</td>';
		additional_sp_info_html += '<td style="text-align: right;">'  + (nuclide_info_dat[i][33] == 1 ? '関数適合' : '積算法') + '</td>';
		var all = '';
		for(var f = 0; f < nuclide_info_dat[i].length; f++) {
			if(f <= 4 || f == 6 || f == 7 || f == 8 || f == 9 || f == 12 || f == 24 || f == 25 || f == 26 || f == 27 || f== 5
				|| f == 34 || f == 35 || f == 19 || f == 20 || f == 33 || f == 10 || f == 11 || f == 29 || f == 30 || f == 48 || f == 46 || f == 49 || f == 47)
				continue;
			all += '[' + f + ']' + nuclide_info_dat[i][f] + ' ';
		}
	//	additional_sp_info_html += '<td style="text-align: right;">'  + all + '</td>';
		additional_sp_info_html += '</tr>';
	}
	additional_sp_info_html += '</table><br>';
	additional_sp_info_html += '※Mark：C:積算法，N:近接処理，D:分割，S:寄与差引，E:同一核種処理，W:和処理，';
	additional_sp_info_html += 'X:レンジ外(測定レンジ外にピークがある)，L:２σ以上，';
	additional_sp_info_html += 'A:注意(サーチされていない計数が，BG分析なら２σ以上，核種分析ならDL以上)，';
	additional_sp_info_html += 'T:試料保存期間が半減期×64を超えた為，試料保存中の減衰補正をOFF<br>';
//	additional_sp_info_html += '※計算方法：G:関数適合，C:積算法<br>';
	
	additional_sp_info_html += '</div>';
	additional_sp_info_html += '<div id="gs2020_nuclide2" style="display: none;">';
	
	additional_sp_info_html += '<table class="csv">';
	additional_sp_info_html += '<tr>';
	additional_sp_info_html += '<th>核種名</th>';
	additional_sp_info_html += '<th>エネルギー<br>(keV)</th>';
	additional_sp_info_html += '<th>ピーク<br>チャンネル<br>(ch)</th>';
	additional_sp_info_html += '<th>ピーク領域<br>(ch)</th>';
	additional_sp_info_html += '<th>ベースライン<br>低<br>(ch)</th>';
	additional_sp_info_html += '<th>ベースライン<br>高<br>(ch)</th>';
	additional_sp_info_html += '<th>半値幅<br>(ch)</th>';
	additional_sp_info_html += '<th>グロス<br>カウント<br>(counts)</th>';
	additional_sp_info_html += '<th>バック<br>グラウンド<br>(counts)</th>';
//	additional_sp_info_html += '<th>妨害<br>カウント<br>(counts)</th>';
//	additional_sp_info_html += '<th>ピーク<br>バックグラウンド<br>(counts)</th>';
//	additional_sp_info_html += '<th>Mark<br>(LSNのみ)</th>';
	additional_sp_info_html += '</tr>';
	for(var i = 0; i < nuclide_info_act.length; i++) {
		additional_sp_info_html += '<tr id="nuclide_info_act_' + i + '">';
		additional_sp_info_html += '<td style="text-align: left;">'   + nuclide_info_act[i][40] + '</td>';
		additional_sp_info_html += '<td style="text-align: right;">'  + Number(nuclide_info_act[i][7]).toFixed(2) + '</td>';
		additional_sp_info_html += '<td style="text-align: right;">'  + Number(nuclide_info_act[i][4]).toFixed(2) + '</td>';
		// 25列がフラグとなっていて，1なら3つの領域全てをピーク領域と扱う
		if(nuclide_info_act[i][25] == 1) {
			additional_sp_info_html += '<td style="text-align: center;">' + nuclide_info_act[i][9] + ' - ' + nuclide_info_act[i][14] + '</td>';
			additional_sp_info_html += '<td style="text-align: center;">' + ' - ' + '</td>';
			additional_sp_info_html += '<td style="text-align: center;">' + ' - ' + '</td>';
		} else {
			additional_sp_info_html += '<td style="text-align: center;">' + nuclide_info_act[i][11] + ' - ' + nuclide_info_act[i][12] + '</td>';
			additional_sp_info_html += '<td style="text-align: center;">' + nuclide_info_act[i][9] + ' - ' + nuclide_info_act[i][10] + '</td>';
			additional_sp_info_html += '<td style="text-align: center;">' + nuclide_info_act[i][13] + ' - ' + nuclide_info_act[i][14] + '</td>';
		}
		additional_sp_info_html += '<td style="text-align: right;">'  + Number(nuclide_info_act[i][8]).toFixed(3) + '</td>';
		additional_sp_info_html += '<td style="text-align: right;">'  + Number(nuclide_info_act[i][15]).toFixed(1) + '</td>';
		additional_sp_info_html += '<td style="text-align: right;">'  + Number(nuclide_info_act[i][20]).toFixed(1) + ' ± ' + Number(nuclide_info_act[i][21]).toFixed(1) + '</td>';
	//	additional_sp_info_html += '<td style="text-align: right;">'  + '</td>';
	//	additional_sp_info_html += '<td style="text-align: right;">'  + '</td>';
		var flag = nuclide_info_act[i][39];
		if(nuclide_info_act[i][24] & 1 || nuclide_info_act[i][24] & 2) {
			flag += 'N';
		}
		if(nuclide_info_act[i][24] & 4 || nuclide_info_act[i][24] & 8) {
			flag += 'S';
		}
	//	additional_sp_info_html += '<td style="text-align: center;">' + flag + '</td>';
	//	additional_sp_info_html += '<td style="text-align: right;">'  + 'ピーク面積' + '</td>';
	//	additional_sp_info_html += '<td style="text-align: right;">'  + '検出限界' + '</td>';
	//	additional_sp_info_html += '<td style="text-align: right;">'  + nuclide_info_act[i][10] + ' ' + nuclide_info_act[i][11] + '</td>';
	//	additional_sp_info_html += '<td style="text-align: right;">'  + Number(nuclide_info_act[i][9]).toFixed(2) + '</td>';
	//	additional_sp_info_html += '<td style="text-align: right;">'  + Number(nuclide_info_act[i][20]).toFixed(6) + '</td>';
	//	additional_sp_info_html += '<td style="text-align: right;">'  + Number(nuclide_info_act[i][19]).toFixed(6) + '</td>';
	//	additional_sp_info_html += '<td style="text-align: right;">'  + '減衰補正' + '</td>';
	//	additional_sp_info_html += '<td style="text-align: right;">'  + (Number(nuclide_info_act[i][12]) * 100).toFixed(3) + '</td>';
	//	additional_sp_info_html += '<td style="text-align: right;">'  + (nuclide_info_act[i][29] == 0 ? Number(nuclide_info_act[i][24]).toExponential(3) : Number(nuclide_info_act[i][29]).toExponential(3))
		var all = '';
		for(var f = 0; f < nuclide_info_act[i].length; f++) {
			if(f == 0 || f == 40 || f == 7 || f == 4 || ( f >= 9 && f <= 14) || f == 8 || f == 15 || f == 20 || f == 21 || f == 1 || f == 39
						|| f == 22 || f == 23 || f == 35 || f == 18 || f == 19)
				continue;
			all += '[' + f + ']' + nuclide_info_act[i][f] + ' ';
		}
	//	additional_sp_info_html += '<td style="text-align: right;">'  + all + '</td>';
		additional_sp_info_html += '</tr>';
	}
	additional_sp_info_html += '</table><br>';
	
	additional_sp_info_html += '</div>';
	additional_sp_info_html += '<div id="gs2020_nuclide3" style="display: none;">';
	
	additional_sp_info_html += '<table class="csv">';
	additional_sp_info_html += '<tr>';
	additional_sp_info_html += '<th>No.</th>';
	additional_sp_info_html += '<th>ピーク<br>チャンネル<br>(ch)</th>';
	additional_sp_info_html += '<th>フィルタ<br>幅<br>(ch)</th>';
	additional_sp_info_html += '<th>半値幅<br>(ch)</th>';
	additional_sp_info_html += '<th>エネルギー<br>(keV)</th>';
	additional_sp_info_html += '<th>グロス<br>カウント<br>(counts)</th>';
	additional_sp_info_html += '<th>バック<br>グラウンド<br>(counts)</th>';
	additional_sp_info_html += '<th>ネット<br>カウント<br>(counts)</th>';
	additional_sp_info_html += '<th></th>';
	additional_sp_info_html += '<th>検出限界<br>カウント<br>(counts)</th>';
	additional_sp_info_html += '<th>核種名</th>';
	additional_sp_info_html += '</tr>';
	for(var i = 0; i < nuclide_info_peak.length; i++) {
		additional_sp_info_html += '<tr id="nuclide_info_peak_' + i + '">';
		additional_sp_info_html += '<td style="text-align: right;">'  + nuclide_info_peak[i][1] + '</td>';
		additional_sp_info_html += '<td style="text-align: right;">'  + Number(nuclide_info_peak[i][4]).toFixed(2) + '</td>';
		additional_sp_info_html += '<td style="text-align: right;">'  + Number(nuclide_info_peak[i][6]).toFixed(2) + '</td>';
		additional_sp_info_html += '<td style="text-align: right;">'  + (nuclide_info_peak[i][31] == 0 ? Number(nuclide_info_peak[i][8]).toFixed(3) : Number(nuclide_info_peak[i][31]).toFixed(3)) + '</td>';
		additional_sp_info_html += '<td style="text-align: right;">'  + Number(nuclide_info_peak[i][7]).toFixed(2) + '</td>';
		additional_sp_info_html += '<td style="text-align: right;">'  + Number(nuclide_info_peak[i][15]).toFixed(1) + '</td>';
		additional_sp_info_html += '<td style="text-align: right;">'  + Number(nuclide_info_peak[i][20]).toFixed(1) + '</td>';
		var netcount = (nuclide_info_peak[i][33] == 0 ? Number(nuclide_info_peak[i][22]).toFixed(1) : Number(nuclide_info_peak[i][33]).toFixed(1))
						+ ' ± ' + (nuclide_info_peak[i][34] == 0 ? Number(nuclide_info_peak[i][23]).toFixed(1) : Number(nuclide_info_peak[i][34]).toFixed(1));
		additional_sp_info_html += '<td style="text-align: right;">'  + netcount + '</td>';
		additional_sp_info_html += '<td style="text-align: center;">' + nuclide_info_peak[i][38] + '</td>';
		additional_sp_info_html += '<td style="text-align: right;">'  + Number(nuclide_info_peak[i][35]).toFixed(1) + '</td>';
		additional_sp_info_html += '<td style="text-align: left;">'  + nuclide_info_peak[i][40].replace("_", ",") + '</td>';
		var all = '';
		for(var f = 0; f < nuclide_info_peak[i].length; f++) {
			if(f == 0 || f == 4 || f == 6 || f == 8 || f == 7 || f == 15 || f == 20 || f == 22 || f == 23 || f == 38 || f == 35 || f == 40 || f == 31)
				continue;
			all += '[' + f + ']' + nuclide_info_peak[i][f] + ' ';
		}
	//	additional_sp_info_html += '<td style="text-align: right;">'  + all + '</td>';
		additional_sp_info_html += '</tr>';
	}
	additional_sp_info_html += '</table><br>';
	
	additional_sp_info_html += '</div>';
	
	
	var make_data = function(name, ch, spe_data) {
		var spectrum_data_ch = [];
		var spectrum_data_ev = [];
		
		var min_count = find_min_count(spe_data);
		for(var i in spe_data) {
			spectrum_data_ch.push([spe_data[i][0], spe_data[i][1]]);
			var chval = spe_data[i][0];
			var evval = ev_slope[0]
							+ ev_slope[1] * chval
							+ ev_slope[2] * Math.pow(chval, 2)
							+ ev_slope[3] * Math.pow(chval, 3)
							+ ev_slope[4] * Math.pow(chval, 4);
			spectrum_data_ev.push([evval, spe_data[i][1]]);
		}
		
		var additional_html_callback = function() {
		};
		
		var spectrum = {
			name: name,
			file: file,
			file_comment: file_comment,
			sp_info: sp_info,
			additional_sp_info_html: additional_sp_info_html,
			additional_html_callback: additional_html_callback,
			time: time,
			min_cps: min_count / time,
			spectrum_data_ch: convert_count2cps(time, spectrum_data_ch),
			spectrum_data_ev: convert_count2cps(time, spectrum_data_ev)
		};
		return spectrum;
	};
	
	var spectrums = {
		data: [make_data('SPE', cur_ch, data)]
	};
	
	return spectrums;
}

function draw_graph_a2700_spectrum(file, file_comment, data) {
	// フォーマットのチェック
	if(data.match(/^Model,"A2702pro"/)) {
		// クリアパルス A2702型 Mr.Gamma MCA
	} else {
		return false;
	}
	
	var lines = split_line(data);
	
	var time;
	var bg_time;
	var ev_slope = [];
	var sp_info = sp_info_gps(file_comment);
	var ch_count;
	
	var spectrum_data_ch = [];
	var spectrum_data_ev = [];
	var spectrum_data_ch_bg = [];
	var spectrum_data_ev_bg = [];
	
	var mode = 'info';
	for(var i in lines) {
		var line = lines[i];
		if(mode == 'info') {
			if(line.match(/^BIN SIZE \(keV\/ch\),([0-9\.]+)$/)) {
				var val = parseFloat(RegExp.$1);
				ev_slope[0] = val;
			}
			if(line.match(/^REAL TIME \(s\),([0-9\.]+)$/)) {
				sp_info.push(["測定時間(Real)", RegExp.$1 + " 秒"]);
			}
			if(line.match(/^Live TIME \(s\),([0-9\.]+)$/)) {
				sp_info.push(["測定時間(Live)", RegExp.$1 + " 秒"]);
				var val = parseFloat(RegExp.$1);
				time = val;
			}
			if(line.match(/^BG REAL TIME \(s\),([0-9\.]+)$/)) {
				sp_info.push(["BG測定時間(Real)", RegExp.$1 + " 秒"]);
			}
			if(line.match(/^BG Live TIME \(s\),([0-9\.]+)$/)) {
				sp_info.push(["BG測定時間(Live)", RegExp.$1 + " 秒"]);
				var val = parseFloat(RegExp.$1);
				bg_time = val;
			}
			if(line.match(/^START TIME,(.*)$/)) {
				sp_info.push(["測定日時", RegExp.$1]);
			}
			if(line.match(/^ItemName,"?(.*?)"?$/)) {
				sp_info.push(["測定名", RegExp.$1]);
			}
			if(line.match(/^Comment,"?(.*?)"?$/)) {
				sp_info.push(["コメント", RegExp.$1]);
			}
			if(line.match(/^BGItemNm,"?(.*?)"?$/)) {
				sp_info.push(["BG測定名", RegExp.$1]);
			}
			if(line.match(/^BGComment,"?(.*?)"?$/)) {
				sp_info.push(["BGコメント", RegExp.$1]);
			}
			if(line.match(/^SampleItemNm,"?(.*?)"?$/)) {
				sp_info.push(["試料測定名", RegExp.$1]);
			}
			if(line.match(/^SampleComment,"?(.*?)"?$/)) {
				sp_info.push(["試料コメント", RegExp.$1]);
			}
			if(line.match(/^CHSize,([0-9]+)$/)) {
				ch_count = parseInt(RegExp.$1);
				mode = 'spectrum';
			}
			if(line.match(/^([0-9]+),([0-9]+),([0-9]+),([\-0-9]+),([\-0-9]+)$/)) {
				var ch = parseInt(RegExp.$1);
				var count = parseInt(RegExp.$2);
				var bg_count = parseInt(RegExp.$3);
				
				spectrum_data_ch.push([parseInt(ch), parseInt(count)]);
				spectrum_data_ev.push([parseInt(ch) * ev_slope[0], parseInt(count)]);
				spectrum_data_ch_bg.push([parseInt(ch), parseInt(bg_count)]);
				spectrum_data_ev_bg.push([parseInt(ch) * ev_slope[0], parseInt(bg_count)]);
			}
		} else if(mode == 'spectrum') {
			if(line.match(/^([0-9]+),([0-9]+)$/)) {
				var ch = RegExp.$1;
				var count = RegExp.$2;
				
				spectrum_data_ch.push([parseInt(ch), parseInt(count)]);
				spectrum_data_ev.push([parseInt(ch) * ev_slope[0], parseInt(count)]);
			}
		}
	}
	
	if(!time)
		return false;
	
	if(!bg_time && (!ch_count || ch_count != spectrum_data_ch.length)) {
		alert("ch数エラー");
		return false;
	}
	
	var min_count = find_min_count(spectrum_data_ch);
	
	if(!bg_time) {
		var spectrum = {
			file: file,
			file_comment: file_comment,
			sp_info: sp_info,
			time: time,
			min_cps: min_count / time,
			spectrum_data_ch: convert_count2cps(time, spectrum_data_ch),
			spectrum_data_ev: convert_count2cps(time, spectrum_data_ev)
		};
		return spectrum;
	} else {
		var spectrum = {
			data:[ {
				name: 'BG',
				file: file,
				file_comment: file_comment,
				sp_info: sp_info,
				time: bg_time,
				min_cps: min_count / bg_time,
				spectrum_data_ch: convert_count2cps(bg_time, spectrum_data_ch),
				spectrum_data_ev: convert_count2cps(bg_time, spectrum_data_ev)
			}, {
				name: 'SPE',
				file: file,
				file_comment: file_comment,
				sp_info: sp_info,
				time: time,
				min_cps: min_count / time,
				spectrum_data_ch: convert_count2cps(time, spectrum_data_ch_bg),
				spectrum_data_ev: convert_count2cps(time, spectrum_data_ev_bg)
			}]
		};
		return spectrum;
	}
}

function draw_graph_csk2i_spectrum(file, file_comment, data) {
	// フォーマットのチェック
	if(data.match(/^保存日時\t/)) {
	} else {
		return false;
	}
	
	var lines = split_line(data);
	
	// フォーマットのチェック
	if(lines[1].match(/^検体情報\t?/)) {
	} else {
		return false;
	}
	if(lines[2].match(/^【検体名】\t/)) {
	} else {
		return false;
	}
	
	var time;
	var bg_time;
	var sp_info = sp_info_gps(file_comment);
	var ch_count = 0;
	
	var spectrum_data_ch = [];
	var spectrum_data_ev = [];
	var spectrum_data_ch_bg = [];
	var spectrum_data_ev_bg = [];
	
	var additional_sp_info_html = '';
	additional_sp_info_html += '<table class="csv">';
	additional_sp_info_html += '<tr>';
	additional_sp_info_html += '<th>核種</th>';
	additional_sp_info_html += '<th>濃度[Bq/kg]</th>';
	additional_sp_info_html += '<th>CPS</th>';
	additional_sp_info_html += '</tr>';
	
	var isotope_range = [];
	
	var iso_no = 0;
	var mode = 'info';
	for(var i in lines) {
		var line = lines[i];
		if(mode == 'info') {
			if(line.match(/^【検体名】\t(.*)$/)) {
				sp_info.push(["検体名", RegExp.$1]);
			}
			if(line.match(/^【採取場所】\t(.*)$/)) {
				sp_info.push(["採取場所", RegExp.$1]);
			}
			if(line.match(/^【採取日時】\t(.*)$/)) {
				sp_info.push(["採取日時", RegExp.$1]);
			}
			if(line.match(/^【重量】\t(.*)$/)) {
				sp_info.push(["重量", RegExp.$1 + " g"]);
			}
			if(line.match(/^【備考】\t(.*)$/)) {
				sp_info.push(["備考", RegExp.$1]);
			}
			if(line.match(/^収録時間\t(.*)$/)) {
				sp_info.push(["収録時間", RegExp.$1 + " 秒"]);
				var val = parseFloat(RegExp.$1);
				time = val;
			}
			if(line.match(/^Energy\/\(keV\)\tCounts$/)) {
				mode = 'spectrum';
			}
		} else if(mode == 'spectrum') {
			if(line.match(/^([0-9\.]+)\t([0-9]+)$/)) {
				var ev = RegExp.$1;
				var count = RegExp.$2;
				
				spectrum_data_ch.push([ch_count++, parseInt(count)]);
				spectrum_data_ev.push([parseFloat(ev), parseInt(count)]);
			}
			if(line.match(/^BGの収録時間\t(.*)$/)) {
				sp_info.push(["BGの収録時間", RegExp.$1 + " 秒"]);
				var val = parseFloat(RegExp.$1);
				bg_time = val;
				ch_count = 0;
				mode = 'bg_spectrum';
			}
		} else if(mode == 'bg_spectrum') {
			if(line.match(/^([0-9\.]+)\t([0-9]+)$/)) {
				var ev = RegExp.$1;
				var count = RegExp.$2;
				
				spectrum_data_ch_bg.push([ch_count++, parseInt(count)]);
				spectrum_data_ev_bg.push([parseFloat(ev), parseInt(count)]);
			}
		} else if(mode == 'isotope') {
			if(line.match(/^([0-9\.]+)\t([0-9\.]+)$/)) {
				additional_sp_info_html += '<tr id="isotope_' + iso_no + '">';
				additional_sp_info_html += '<td>' + (iso_no + 1) + '</td>';
				additional_sp_info_html += '<td>' + RegExp.$1 + '</td>';
				additional_sp_info_html += '<td>' + RegExp.$2 + '</td>';
				additional_sp_info_html += '</tr>';
				isotope_range[iso_no] = [find_ev2ch_in_spectrum(spectrum_data_ev, parseFloat(RegExp.$1)),
											find_ev2ch_in_spectrum(spectrum_data_ev, parseFloat(RegExp.$2))];
				iso_no++;
			} else {
				// なぜか最後に情報が追加であるので登録しておく
				if(line.match(/^([^\t]+)\t(.*)$/)) {
					sp_info.push([RegExp.$1, RegExp.$2]);
				}
			}
		}
		if(line.match(/^(カリウム|セシウム134|セシウム137)放射能\t([^\[]+)(\[.*)$/)) {
			additional_sp_info_html += '<tr>';
			additional_sp_info_html += '<td>' + RegExp.$1 + '</td>';
			additional_sp_info_html += '<td>' + RegExp.$2 + '</td>';
			additional_sp_info_html += '<td>' + RegExp.$3 + '</td>';
			additional_sp_info_html += '</tr>';
		}
		if(line.match(/^\tROI配列$/)) {
			mode = 'isotope';
			
			additional_sp_info_html += '</table>';
			additional_sp_info_html += '<br>';
			additional_sp_info_html += '<table class="csv">';
			additional_sp_info_html += '<tr>';
			additional_sp_info_html += '<th>ROI</th>';
			additional_sp_info_html += '<th>開始(keV)</th>';
			additional_sp_info_html += '<th>終了(keV)</th>';
			additional_sp_info_html += '</tr>';
		}
	}
	additional_sp_info_html += '</table>';
	
	var additional_html_callback = function() {
		for(var isotope in isotope_range) {
			(function(i) {
				$("#isotope_" + i).bind('mouseenter', function() {
					$(this).css('background', '#ffdddd');
					
					graph_clear_marking();
					
					var marking_option = {
						grid: {
							markings: [
								{
									color: '#ffdddd',
									xaxis: {
										from: isotope_range[i][0],
										to: isotope_range[i][1]
									}
								}
							]
						}
					};
					draw_graph_common_update(marking_option);
				}).bind('mouseleave', function() {
					$(this).css('background', '');
					
					plot.clearSelection();
					graph_clear_marking();
				});
			})(isotope);
		}
	};
	
	if(!time)
		return false;
	
	var min_count = find_min_count(spectrum_data_ch);
	
	if(!bg_time) {
		var spectrum = {
			file: file,
			file_comment: file_comment,
			sp_info: sp_info,
			additional_sp_info_html: additional_sp_info_html,
			additional_html_callback: additional_html_callback,
			time: time,
			min_cps: min_count / time,
			spectrum_data_ch: convert_count2cps(time, spectrum_data_ch),
			spectrum_data_ev: convert_count2cps(time, spectrum_data_ev)
		};
		return spectrum;
	} else {
		// なぜかスペクトルデータはBGと試料が入れ代わっている
		var spectrum = {
			data:[ {
				name: 'BG',
				file: file,
				file_comment: file_comment,
				sp_info: sp_info,
				time: bg_time,
				min_cps: min_count / bg_time,
				spectrum_data_ch: convert_count2cps(bg_time, spectrum_data_ch),
				spectrum_data_ev: convert_count2cps(bg_time, spectrum_data_ev)
			}, {
				name: 'SPE',
				file: file,
				file_comment: file_comment,
				sp_info: sp_info,
				additional_sp_info_html: additional_sp_info_html,
				additional_html_callback: additional_html_callback,
				time: time,
				min_cps: min_count / time,
				spectrum_data_ch: convert_count2cps(time, spectrum_data_ch_bg),
				spectrum_data_ev: convert_count2cps(time, spectrum_data_ev_bg)
			}]
		};
		return spectrum;
	}
}

function draw_graph_csk3ix_spectrum(file, file_comment, data) {
	// フォーマットのチェック
	if(data.match(/^保存日時,/)) {
	} else {
		return false;
	}
	
	var lines = split_line(data);
	
	// フォーマットのチェック
	if(lines[1].match(/^測定番号,/)) {
	} else {
		return false;
	}
	if(lines[2].match(/^検体名,/)) {
	} else {
		return false;
	}
	
	var time;
	var bg_time;
	var sp_info = sp_info_gps(file_comment);
	var ch_count = 0;
	
	var spectrum_data_ch = [];
	var spectrum_data_ev = [];
	var spectrum_data_ch_bg = [];
	var spectrum_data_ev_bg = [];
	
	var additional_sp_info_html = '';
	additional_sp_info_html += '<table class="csv">';
	
	var mode = 'info';
	for(var i in lines) {
		var line = lines[i];
		if(mode == 'info') {
			if(line.match(/^保存日時,([^,]*)/)) {
				sp_info.push(["保存日時", RegExp.$1]);
			}
			if(line.match(/^測定番号,([^,]*)/)) {
				sp_info.push(["測定番号", RegExp.$1]);
			}
			if(line.match(/^検体名,([^,]*)/)) {
				sp_info.push(["検体名", RegExp.$1]);
			}
			if(line.match(/^採取場所,([^,]*)/)) {
				sp_info.push(["採取場所", RegExp.$1]);
			}
			if(line.match(/^採取日,([^,]*)/)) {
				sp_info.push(["採取日", RegExp.$1]);
			}
			if(line.match(/^検体重量,([^,]*)/)) {
				sp_info.push(["重量", RegExp.$1 + " g"]);
			}
			if(line.match(/^備考,([^,]*)/)) {
				sp_info.push(["備考", RegExp.$1]);
			}
			if(line.match(/^測定容器番号,([^,]*)/)) {
				sp_info.push(["測定容器番号", RegExp.$1]);
			}
			if(line.match(/^検査場所,([^,]*)/)) {
				sp_info.push(["検査場所", RegExp.$1]);
			}
			if(line.match(/^検査担当者,([^,]*)/)) {
				sp_info.push(["検査担当者", RegExp.$1]);
			}
			if(line.match(/^測定開始日時,([^,]*)/)) {
				sp_info.push(["測定開始日時", RegExp.$1]);
			}
			if(line.match(/^測定時間,([^,]*)/)) {
				sp_info.push(["測定時間", RegExp.$1 + " 秒"]);
				var val = parseFloat(RegExp.$1);
				time = val;
			}
			if(line.match(/^BG測定時間,([^,]*)/)) {
				sp_info.push(["BG測定時間", RegExp.$1 + " 秒"]);
				var val = parseFloat(RegExp.$1);
				bg_time = val;
			}
			if(line.match(/^バックグラウンド,,$/)) {
				mode = 'bg_spectrum';
			}
		} else if(mode == 'bg_spectrum') {
			if(line.match(/^(\-?[0-9\.]+),([0-9\.]+),$/)) {
				var ev = RegExp.$1;
				var cps = RegExp.$2;
				
				spectrum_data_ch_bg.push([ch_count++, parseFloat(cps)]);
				spectrum_data_ev_bg.push([parseFloat(ev), parseFloat(cps)]);
			}
			if(line.match(/^測定値,,$/)) {
				ch_count = 0;
				mode = 'spectrum';
			}
		} else if(mode == 'spectrum') {
			if(line.match(/^(\-?[0-9\.]+),([0-9\.]+),$/)) {
				var ev = RegExp.$1;
				var cps = RegExp.$2;
				
				spectrum_data_ch.push([ch_count++, parseFloat(cps)]);
				spectrum_data_ev.push([parseFloat(ev), parseFloat(cps)]);
			}
			if(line.match(/^$/)) {
				mode = 'isotope';
			}
		} else if(mode == 'isotope') {
			if(line.match(/^([^,]+),([^,]+),$/)) {
				additional_sp_info_html += '<tr>';
				additional_sp_info_html += '<td>' + RegExp.$1 + '</td>';
				additional_sp_info_html += '<td>' + RegExp.$2 + '</td>';
				additional_sp_info_html += '</tr>';
			}
		}
	}
	additional_sp_info_html += '</table>';
	
	
	if(!time)
		return false;
	
	var min_count = find_min_count(spectrum_data_ch);
	
	if(!bg_time) {
		var spectrum = {
			file: file,
			file_comment: file_comment,
			sp_info: sp_info,
			additional_sp_info_html: additional_sp_info_html,
			time: time,
			min_cps: min_count / time,
			spectrum_data_ch: spectrum_data_ch,
			spectrum_data_ev: spectrum_data_ev
		};
		return spectrum;
	} else {
		// なぜかスペクトルデータはBGと試料が入れ代わっている
		var spectrum = {
			data:[ {
				name: 'BG',
				file: file,
				file_comment: file_comment,
				sp_info: sp_info,
				time: bg_time,
				min_cps: min_count / bg_time,
				spectrum_data_ch: spectrum_data_ch_bg,
				spectrum_data_ev: spectrum_data_ev_bg
			}, {
				name: 'SPE',
				file: file,
				file_comment: file_comment,
				sp_info: sp_info,
				additional_sp_info_html: additional_sp_info_html,
				time: time,
				min_cps: min_count / time,
				spectrum_data_ch: spectrum_data_ch,
				spectrum_data_ev: spectrum_data_ev
			}]
		};
		return spectrum;
	}
}

function find_ev2ch_in_spectrum(spectrum_data_ev, ev) {
	var x;
	$.each(spectrum_data_ev, function(i, val) {
		if(!x && val[0] >= ev) {
			x = i;
		}
	});
	if(x) {
		return x;
	} else {
		return undefined;
	}
}

function spectrum_filter(spectrum_data) {
	
	var filter = parseInt($("#filter").val());
	var filter_type = $("#filter_type").val();
	
	if(filter_type == "none") {
		return spectrum_data;
	}
	if(filter == 0) {
		return spectrum_data;
	}
	
	if(filter_type == "sma") {
		var new_spectrum_data = [];
		for(var ch = 0; ch < spectrum_data.length; ch++) {
			var sum = 0;
			var count = 0;
			for(var ch2 = ch - filter; ch2 <= ch + filter; ch2++) {
				if(ch2 < 0 || ch2 >= spectrum_data.length)
					continue;
				sum += spectrum_data[ch2][1];
				count++;
			}
			var avg = sum / count;
			new_spectrum_data.push([spectrum_data[ch][0], avg]);
		}
		
		return new_spectrum_data;
	} else if(filter_type == "wma") {
		var new_spectrum_data = [];
		for(var ch = 0; ch < spectrum_data.length; ch++) {
			var sum = 0;
			var count = 0;
			var weight = 0;
			for(var ch2 = ch - filter; ch2 <= ch + filter; ch2++) {
				if(ch2 <= ch) {
					weight++;
				} else {
					weight--;
				}
				if(ch2 < 0 || ch2 >= spectrum_data.length)
					continue;
				sum += spectrum_data[ch2][1] * weight;
				count += weight;
			}
			var avg = sum / count;
			new_spectrum_data.push([spectrum_data[ch][0], avg]);
		}
		
		return new_spectrum_data;
	} else {
		alert("filter_type error");
	}
}

function setup_multiple_spectrum(spectrum) {
	// 複数スペクトルがなければそのまま戻る
	if(spectrum['data'] == undefined) {
		$("#sp_sel").html('');
		spectrum['no'] = 0;
		return spectrum;
	}
	
	// スペクトル選択を表示
	var selected_no = parseInt($("input[name='spe_sel']:checked").val());
	if(isNaN(selected_no)) {
		if(document.location.hash.match(/^#__(.*)/)) {
			var hashstr = RegExp.$1.split("//");
			selected_no = parseInt(hashstr[1]);
			if(selected_no >= spectrum['data'].length)
				selected_no = 0;
		} else {
			selected_no = 0;
		}
	}
	
	var html = '■スペクトル選択<br><table class="csv">';
	for(var no = 0; no < spectrum['data'].length; no++) {
		html += '<tr>';
		html += '<td><input type="radio" name="spe_sel" value="' + no + '" '
					+ (selected_no == no ? 'checked' : '')
					+ '></td>';
		html += '<td>' + spectrum['data'][no]['name'] + '</td>';
		html += '<td>' + spectrum['data'][no]['file_comment'] + '</td>';
		html += '</tr>';
	}
	html += '</table>';
	$("#sp_sel").html(html);
	
	// 選択変更時の再表示
	$("#sp_sel input[name='spe_sel']").unbind('change').bind('change', function() {
		draw_graph_common(spectrum);
	});
	
	// 選ばれているスペクトル情報を返す
	spectrum['data'][selected_no]['no'] = selected_no;
	return spectrum['data'][selected_no];
}

function draw_graph_common(spectrum) {
	placeholder.unbind("plotselected");
	
	var selected_spectrum = setup_multiple_spectrum(spectrum);
	print_sp_info(selected_spectrum);
	
	var spectrum_data_ch = spectrum_filter(selected_spectrum['spectrum_data_ch']);
	var spectrum_data_ev = spectrum_filter(selected_spectrum['spectrum_data_ev']);
	
	
	var find_ev_x = function(ch) {
		var x;
		$.each(spectrum_data_ch, function(i, val) {
			if(!x && val[0] >= ch) {
				x = i;
			}
		});
		if(x) {
			return spectrum_data_ev[x][0];
		} else {
			return undefined;
		}
	};
	
	var find_ch_from_ev = function(ev) {
		var ch;
		$.each(spectrum_data_ev, function(i, val) {
			if(!ch && val[0] >= ev) {
				ch = i;
			}
		});
		if(ch) {
			return spectrum_data_ch[ch][0];
		} else {
			return undefined;
		}
	};
	
	var plot_data = [
		{
			id: 'value',
			data: spectrum_data_ch,
			lines: { show: true, lineWidth: 1 },
			color: "#edc240"
		}
	];
	var plot_options = {
		xaxes: [
			{
				show: true
			},
			{
				show: true
			}
		],
		series: {
			lines: { show: true }
		},
		crosshair: { mode: "x" },
		grid: { hoverable: true, autoHighlight: false },
		selection: {
			mode: "x"
		}
	};
	
	plot = $.plot(placeholder, plot_data, plot_options);
	
	var axes = plot.getAxes();
	var x_range = [axes.xaxis.min, axes.xaxis.max];
	
	var cpsDecimals = Math.floor(Math.log(selected_spectrum['min_cps']) / Math.log(10));
	cpsDecimals = (cpsDecimals < 0) ? -cpsDecimals : 0;
	
	var y_range_max = 0;
	for(var i = 0; i < spectrum_data_ch.length; i++) {
		if(y_range_max < spectrum_data_ch[i][1])
			y_range_max = spectrum_data_ch[i][1];
	}
	
	plot_options = $.extend(true, {}, plot_options, {
		yaxes: [
			{
				min: 0,
				max: y_range_max * parseFloat($("#max_range").val()) / 100,
				tickFormatter: format_cps
			}
		],
		xaxes: [
			{
				show: true,
				tickFormatter: format_ch,
				min: x_range[0],
				max: x_range[1]
			},
			{
				show: true,
				tickFormatter: format_ev,
				min: find_ev_x(x_range[0]),
				max: find_ev_x(x_range[1])
			}
		]
	});
	plot = $.plot(placeholder, plot_data, plot_options);
	
	
	// カーソル位置情報
	
	var updateCursorTimeout = null;
	var latestPosition = null;
	
	function updateCursor() {
		updateCursorTimeout = null;
		var pos = latestPosition;
		
		var axes = plot.getAxes();
		if (pos.x < axes.xaxis.min || pos.x > axes.xaxis.max ||
			pos.y < axes.yaxis.min || pos.y > axes.yaxis.max)
			return;
		
		var dataset = plot.getData();
		for(var i = 0; i < dataset.length; ++i) {
			var series = dataset[i];
			if(series['id'] != "value")
				continue;
			
			// find the nearest points, x-wise
			var j;
			for(j = 0; j < series.data.length; ++j) {
				if (series.data[j][0] > pos.x)
					break;
			}
			if(j >= series.data.length)
				j = series.data.length - 1;
			
			if(j != undefined) {
				var ch = series.data[j][0]
				var cps = series.data[j][1];
				
				update_curosr_info(ch, find_ev_x(ch), cps, cpsDecimals, selected_spectrum['time'], find_ch_from_ev);
				update_curosr_nuclear(find_ev_x(ch), cpsDecimals);
			}
			
		}
		
	}
	
	// 縦線処理
	
	placeholder.bind("plothover", function(event, pos, item) {
		latestPosition = pos;
		if(!updateCursorTimeout)
			updateCursorTimeout = setTimeout(updateCursor, 50);
	});
	
	// 選択・ズーム処理
	
	$("#zoomout").unbind('click').bind('click', function(){
		var new_options = {
			xaxes: [
				{
					min: x_range[0],
					max: x_range[1]
				},
				{
					min: find_ev_x(x_range[0]),
					max: find_ev_x(x_range[1])
				}
			]
		};
		draw_graph_common_update(new_options);
	});
	
	placeholder.bind("plotselected", function(event, ranges) {
		
		var selected_x_range = [ranges.xaxis.from, ranges.xaxis.to];
		
		var zoom_fun = function() {
			var new_options = {
				xaxes: [
					{
						min: selected_x_range[0],
						max: selected_x_range[1]
					},
					{
						min: find_ev_x(selected_x_range[0]),
						max: find_ev_x(selected_x_range[1])
					}
				]
			};
			
			plot.clearSelection();
			graph_clear_marking();
			draw_graph_common_update(new_options);
		};
		
		$("#zoom").unbind('click').bind('click', zoom_fun);
		
		
	});
	
	// 範囲プリセット
	var range_preset_html = '範囲設定：';
	for(var i in range_preset) {
		range_preset_html += '<input type="button" id="range_preset_' + i + '" value="' + range_preset[i][0] + '">';
	}
	range_preset_html += '<br><br>';
	$("#range_preset").html(range_preset_html);
	for(var i in range_preset) {
		(function(ii) {
			$("#range_preset_" + i).bind('click', function() {
				var ch_low = range_preset[ii][1] - range_preset[ii][1] * range_preset[ii][2] / 100;
				var ch_high = range_preset[ii][1] + range_preset[ii][1] * range_preset[ii][3] / 100;
				plot.setSelection({
					xaxis: {
						from: find_ev2ch_in_spectrum(spectrum_data_ev, ch_low),
						to: find_ev2ch_in_spectrum(spectrum_data_ev, ch_high)
					}
				});
			});
		})(i)
	}
	
	// 選択範囲情報表示
	
	$("#bg_range_left").bind('click', function() {
		if(range_select_mode == 'left') {
			range_select_mode = 'center';
			$("#bg_range_left").css('background-color', '');
		} else {
			range_select_mode = 'left';
			$("#bg_range_left").css('background-color', '#c0c0ff');
		}
	});
	$("#bg_range_right").bind('click', function() {
		if(range_select_mode == 'right') {
			range_select_mode = 'center';
			$("#bg_range_right").css('background-color', '');
		} else {
			range_select_mode = 'right';
			$("#bg_range_right").css('background-color', '#c0c0ff');
		}
	});
	
	placeholder.bind("plotselected", function(event, ranges) {
		if(selected_spectrum['without_bg']) {
			update_selection_info_without_bg(selected_spectrum, spectrum_data_ch, ranges, find_ev_x, cpsDecimals);
		} else {
			if(range_select_mode == 'center') {
				range_selectd = ranges;
				var from = Math.round(ranges.xaxis.from);
				var to = Math.round(ranges.xaxis.to);
				
				var bgrange = $("#bgrange").val();
				var bgcount = Math.ceil(bgrange * selected_spectrum['spectrum_data_ch'].length);
				range_selectd_left = [from - bgcount, from - 1];
				range_selectd_right = [to + 1, to + bgcount];
				
				$("#bg_range_selector_manual").show();
			} else if(range_select_mode == 'left') {
				var from = Math.round(ranges.xaxis.from);
				var to = Math.round(ranges.xaxis.to);
				
				range_selectd_left = [from, to];
			} else if(range_select_mode == 'right') {
				var from = Math.round(ranges.xaxis.from);
				var to = Math.round(ranges.xaxis.to);
				
				range_selectd_right = [from, to];
			}
			range_select_mode = 'center';
			$("#bg_range_left").css('background-color', '');
			$("#bg_range_right").css('background-color', '');
			update_selection_info(selected_spectrum, spectrum_data_ch, range_selectd, find_ev_x, cpsDecimals);
		}
	});
	
	// 縦軸表示範囲
	$("#max_range").unbind('change').bind('change', function() {
		draw_graph_common(spectrum);
	});
	
	// 移動平均方法
	$("#filter_type").unbind('change').bind('change', function() {
		draw_graph_common(spectrum);
	});
	
	// 移動平均ch
	$("#filter").unbind('change').bind('change', function() {
		draw_graph_common(spectrum);
	});
	
	// TSV変換
	$("#save_tsv").unbind('click').bind('click', function() {
		save_tsv(selected_spectrum);
	});
	
	
	// 対数表示
	
	var min_cps = selected_spectrum['min_cps'];
	$("#log").unbind('change').bind('change', function() {
		draw_graph_common_update_log(min_cps);
	});
	draw_graph_common_update_log(min_cps);
	
	
}

function save_tsv(spectrum) {
	var html = '';
	html += 'TSVデータ: 測定時間: ' + spectrum['time'] + ' 秒 ';
	html += '<input type="button" id="tsv_data_close" value="閉じる"><br>';
	html += '<textarea id="tsv_data_text" cols="80" rows="20"></textarea>';
	$("#tsv_data").html(html);
	
	$("#tsv_data_close").unbind('click').bind('click', function() {
		$("#tsv_data").html('');
	});
	
	var text = '';
	for(var i in spectrum['spectrum_data_ev']) {
		text += spectrum['spectrum_data_ev'][i][0] + "\t" + spectrum['spectrum_data_ev'][i][1] + "\r\n";
	}
	$("#tsv_data_text").val(text);
	
}

function setup_multiple_spectrum_compare(spectrums) {
	// 複数スペクトルがなければそのまま戻る
	if(spectrums[0]['data'] == undefined && spectrums[1]['data'] == undefined) {
		$("#sp_sel").html('');
		spectrums[0]['no'] = 0;
		spectrums[1]['no'] = 0;
		return spectrums;
	}
	
	// 単一スペクトルのデータ構造を複数スペクトルに
	if(spectrums[0]['data'] == undefined) {
		spectrums[0]['data'] = [spectrums[0]];
		spectrums[0]['data'][0]['name'] = 'SPE';
	}
	if(spectrums[1]['data'] == undefined) {
		spectrums[1]['data'] = [spectrums[1]];
		spectrums[1]['data'][0]['name'] = 'SPE';
	}
	
	
	// スペクトル選択を表示
	var selected_no1 = parseInt($("input[name='spe_sel1']:checked").val());
	if(isNaN(selected_no1)) {
		if(document.location.hash.match(/^#2__(.*)/)) {
			var hashstr = RegExp.$1.split("//");
			var url_sel_no = hashstr[1].split("/");
			selected_no1 = parseInt(url_sel_no[0]);
			if(selected_no1 >= spectrums[0]['data'].length)
				selected_no1 = 0;
		} else {
			selected_no1 = 0;
		}
	}
	
	var selected_no2 = parseInt($("input[name='spe_sel2']:checked").val());
	if(isNaN(selected_no2)) {
		if(document.location.hash.match(/^#2__(.*)/)) {
			var hashstr = RegExp.$1.split("//");
			var url_sel_no = hashstr[1].split("/");
			selected_no2 = parseInt(url_sel_no[1]);
			if(selected_no2 >= spectrums[1]['data'].length)
				selected_no2 = 0;
		} else {
			selected_no2 = 0;
		}
	}
	
	var html = '■スペクトル選択<br><table class="csv">';
	for(var no = 0; no < spectrums[0]['data'].length; no++) {
		html += '<tr>';
		html += '<td><input type="radio" name="spe_sel1" value="' + no + '" '
					+ (selected_no1 == no ? 'checked' : '')
					+ '></td>';
		html += '<td>' + spectrums[0]['data'][no]['name'] + '</td>';
		html += '<td>' + spectrums[0]['data'][no]['file_comment'] + '</td>';
		html += '</tr>';
	}
	html += '</table><br><table class="csv">';
	for(var no = 0; no < spectrums[1]['data'].length; no++) {
		html += '<tr>';
		html += '<td><input type="radio" name="spe_sel2" value="' + no + '" '
					+ (selected_no2 == no ? 'checked' : '')
					+ '></td>';
		html += '<td>' + spectrums[1]['data'][no]['name'] + '</td>';
		html += '<td>' + spectrums[1]['data'][no]['file_comment'] + '</td>';
		html += '</tr>';
	}
	html += '</table>';
	$("#sp_sel").html(html);
	
	// 選択変更時の再表示
	$("#sp_sel input[name='spe_sel1']").unbind('change').bind('change', function() {
		draw_graph_common_compare(spectrums);
	});
	$("#sp_sel input[name='spe_sel2']").unbind('change').bind('change', function() {
		draw_graph_common_compare(spectrums);
	});
	
	// 選ばれているスペクトル情報を返す
	spectrums[0]['data'][selected_no1]['no'] = selected_no1;
	spectrums[1]['data'][selected_no2]['no'] = selected_no2;
	return [
		spectrums[0]['data'][selected_no1],
		spectrums[1]['data'][selected_no2]
	];
}

function draw_graph_common_compare(spectrums) {
	placeholder.unbind("plotselected");
	
	var selected_spectrums = setup_multiple_spectrum_compare(spectrums);
	print_sp_info_compare(selected_spectrums);
	
	var spectrums_data = [];
	for(var spe_no = 0; spe_no < 2; spe_no++) {
		spectrums_data[spe_no] = [];
		for(var ch = 0; ch < selected_spectrums[spe_no]['spectrum_data_ev'].length; ch++) {
			spectrums_data[spe_no][ch] = selected_spectrums[spe_no]['spectrum_data_ev'][ch];
		}
	}
	
	// 両方BG無しのスペクトル形式の場合，加算する
	if(selected_spectrums[0]['without_bg'] && selected_spectrums[1]['without_bg']) {
		for(var ch = 0; ch < spectrums_data[0].length && ch < spectrums_data[1].length; ch++) {
			spectrums_data[1][ch][1] += spectrums_data[0][ch][1];
		}
	}
	
	spectrums_data[0] = spectrum_filter(spectrums_data[0]);
	spectrums_data[1] = spectrum_filter(spectrums_data[1]);
	
	var y_range_max = 0;
	for(var s = 0; s < 2; s++) {
		for(var i = 0; i < spectrums_data[s].length; i++) {
			if(y_range_max < spectrums_data[s][i][1])
				y_range_max = spectrums_data[s][i][1];
		}
	}
	
	var plot_data = [
		{
			id: 'value0',
			label: 'A(BG)',
			data: spectrums_data[0],
			lines: { show: true, lineWidth: 1 },
			color: "#edc240"
		},
		{
			id: 'value1',
			label: 'B',
			data: spectrums_data[1],
			lines: { show: true, lineWidth: 1 },
			color: "#afd8f8"
		}
	];
	var plot_options = {
		yaxes: [
			{
				min: 0,
				max: y_range_max * parseFloat($("#max_range").val()) / 100,
				tickFormatter: format_cps
			}
		],
		xaxes: [
			{
				show: true
			}
		],
		series: {
			lines: { show: true }
		},
		crosshair: { mode: "x" },
		grid: { hoverable: true, autoHighlight: false },
		selection: {
			mode: "x"
		}
	};
	
	plot = $.plot(placeholder, plot_data, plot_options);
	
	var axes = plot.getAxes();
	var x_range = [axes.xaxis.min, axes.xaxis.max];
	
	var cpsDecimals = Math.floor(Math.log(selected_spectrums[0]['min_cps']) / Math.log(10));
	var cpsDecimals2 = Math.floor(Math.log(selected_spectrums[1]['min_cps']) / Math.log(10));
	
	if(cpsDecimals < cpsDecimals2)
		cpsDecimals = cpsDecimals2;
	
	cpsDecimals = (cpsDecimals < 0) ? -cpsDecimals : 0;
	
	plot_options = $.extend(true, {}, plot_options, {
		yaxes: [
			{
				tickFormatter: format_cps,
				min: 0
			}
		],
		xaxes: [
			{
				show: true,
				tickFormatter: format_ev,
				min: x_range[0],
				max: x_range[1]
			}
		]
	});
	plot = $.plot(placeholder, plot_data, plot_options);
	
	
	// カーソル位置情報
	
	var updateCursorTimeout = null;
	var latestPosition = null;
	
	function updateCursor() {
		updateCursorTimeout = null;
		var pos = latestPosition;
		
		var axes = plot.getAxes();
		if (pos.x < axes.xaxis.min || pos.x > axes.xaxis.max ||
			pos.y < axes.yaxis.min || pos.y > axes.yaxis.max)
			return;
		
		var dataset = plot.getData();
		
		var yvalues = [];
		
		for(var i = 0; i < dataset.length; ++i) {
			if(dataset[i]['id'] != "value0" && dataset[i]['id'] != "value1")
				continue;
			
			var y = find_x_cps(dataset[i].data, pos.x);
			yvalues.push(y);
		}
		
		update_curosr_info_compare(pos.x, yvalues, cpsDecimals);
		update_curosr_nuclear(pos.x, cpsDecimals);
	}
	
	// 縦線処理
	
	placeholder.bind("plothover", function(event, pos, item) {
		latestPosition = pos;
		if(!updateCursorTimeout)
			updateCursorTimeout = setTimeout(updateCursor, 50);
	});
	
	// 選択・ズーム処理
	
	$("#zoomout").unbind('click').bind('click', function(){
		var new_options = {
			xaxes: [
				{
					min: x_range[0],
					max: x_range[1]
				}
			]
		};
		draw_graph_common_update(new_options);
	});
	
	placeholder.bind("plotselected", function(event, ranges) {
		
		var selected_x_range = [ranges.xaxis.from, ranges.xaxis.to];
		
		var zoom_fun = function() {
			var new_options = {
				xaxes: [
					{
						min: selected_x_range[0],
						max: selected_x_range[1]
					}
				]
			};
			plot.clearSelection();
			draw_graph_common_update(new_options);
		};
		
		$("#zoom").unbind('click').bind('click', zoom_fun);
		
		
	});
	
	// 範囲プリセット
	var range_preset_html = '範囲設定：';
	for(var i in range_preset) {
		range_preset_html += '<input type="button" id="range_preset_' + i + '" value="' + range_preset[i][0] + '">';
	}
	range_preset_html += '<br><br>';
	$("#range_preset").html(range_preset_html);
	for(var i in range_preset) {
		(function(ii) {
			$("#range_preset_" + i).bind('click', function() {
				var ch_low = range_preset[ii][1] - range_preset[ii][1] * range_preset[ii][2] / 100;
				var ch_high = range_preset[ii][1] + range_preset[ii][1] * range_preset[ii][3] / 100;
				plot.setSelection({
					xaxis: {
						from: ch_low,
						to: ch_high
					}
				});
			});
		})(i)
	}
	
	// 選択範囲情報表示
	
	placeholder.bind("plotselected", function(event, ranges) {
		update_selection_info_compare(selected_spectrums, spectrums_data, ranges, cpsDecimals);
	});
	
	// 縦軸表示範囲
	$("#max_range").unbind('change').bind('change', function() {
		draw_graph_common_compare(spectrums);
	});
	
	// 移動平均方法
	$("#filter_type").unbind('change').bind('change', function() {
		draw_graph_common_compare(spectrums);
	});
	
	// 移動平均ch
	$("#filter").unbind('change').bind('change', function() {
		draw_graph_common_compare(spectrums);
	});
	
	// 対数表示
	
	var min_cps = selected_spectrums[0]['min_cps'];
	if(min_cps > selected_spectrums[1]['min_cps'])
		min_cps = selected_spectrums[1]['min_cps'];
	
	$("#log").unbind('change').bind('change', function() {
		draw_graph_common_update_log(min_cps);
	});
	draw_graph_common_update_log(min_cps);
	
	
}

function setup_multiple_spectrum_multi(spectrums) {
	var spectrum_count = spectrums.length;
	
	// 複数スペクトルがなければそのまま戻る
	var is_all_single = 1;
	for(var sp = 0; sp < spectrum_count; sp++) {
		if(spectrums[sp]['data']) {
			is_all_single = 0;
			break;
		}
	}
	if(is_all_single) {
		$("#sp_sel").html('');
		for(var sp = 0; sp < spectrum_count; sp++) {
			spectrums[sp]['no'] = 0;
		}
		return spectrums;
	}
	
	
	// 単一スペクトルのデータ構造を複数スペクトルに
	for(var sp = 0; sp < spectrum_count; sp++) {
		if(spectrums[sp]['data'] == undefined) {
			spectrums[sp]['data'] = [spectrums[sp]];
			spectrums[sp]['data'][0]['name'] = 'SPE';
		}
	}
	
	
	// スペクトル選択を表示
	var selected_count = 0;
	var selected_no = [];
	for(var sp = 0; sp < spectrum_count; sp++) {
		selected_no[sp] = [];
		$("input[name='spe_sel" + sp + "']:checked").each(function(i, e) {
			var no = parseInt($(e).val());
			selected_no[sp].push(no);
			selected_count++;
		});
	}
	if(selected_count == 0) {
		if(document.location.hash.match(/^#3__(.*)/)) {
			var hashstr = RegExp.$1.split("//");
			var url_sel_no = hashstr[1].split("/");
			for(var sp = 0; sp < spectrum_count; sp++) {
				if(url_sel_no[sp] != undefined) {
					selected_no[sp] = url_sel_no[sp].split(".");
					for(var i = 0; i < selected_no[sp].length; i++) {
						selected_no[sp][i] = parseInt(selected_no[sp][i]);
						if(selected_no[sp][i] >= spectrums[sp]['data'].length)
							selected_no[sp][i] = 0;
					}
				}
			}
		} else {
			for(var sp = 0; sp < spectrum_count; sp++) {
				selected_no[sp] = [0];
			}
		}
	}
	
	var html = '■スペクトル選択<br>';
	for(var sp = 0; sp < spectrum_count; sp++) {
		html += '<table class="csv">';
		for(var no = 0; no < spectrums[sp]['data'].length; no++) {
			var checked = false;
			for(var c in selected_no[sp]) {
				if(selected_no[sp][c] == no)
					checked = true;
			}
			var disabled = false;
			if(selected_count >= 5 && !checked) {
				disabled = true;
			}
			
			html += '<tr>';
			html += '<td><input type="checkbox" name="spe_sel' + sp + '" value="' + no + '" '
						+ (checked ? 'checked' : '') + (disabled ? ' disabled' : '')
						+ '></td>';
			html += '<td>' + spectrums[sp]['data'][no]['name'] + '</td>';
			html += '<td>' + spectrums[sp]['data'][no]['file_comment'] + '</td>';
			html += '</tr>';
		}
		html += '</table><br>';
	}
	$("#sp_sel").html(html);
	
	// 選択変更時の再表示
	for(var sp = 0; sp < spectrum_count; sp++) {
		$("#sp_sel input[name='spe_sel" + sp + "']").unbind('change').bind('change', function() {
			draw_graph_common_multi(spectrums);
		});
	}
	
	// 選ばれているスペクトル情報を返す
	var return_specturm = [];
	for(var sp = 0; sp < spectrum_count; sp++) {
		for(var no = 0; no < spectrums[sp]['data'].length; no++) {
			var checked = false;
			for(var c in selected_no[sp]) {
				if(selected_no[sp][c] == no)
					checked = true;
			}
			if(checked) {
				spectrums[sp]['data'][no]['no'] = no;
				return_specturm.push(spectrums[sp]['data'][no]);
			}
		}
	}
	
	return return_specturm;
}

function draw_graph_common_multi(spectrums) {
	placeholder.unbind("plotselected");
	
	var selected_spectrums = setup_multiple_spectrum_multi(spectrums);
	print_sp_info_multi(selected_spectrums);
	
	var spectrums_data = [];
	for(var spe_no = 0; spe_no < selected_spectrums.length; spe_no++) {
		spectrums_data[spe_no] = [];
		for(var ch = 0; ch < selected_spectrums[spe_no]['spectrum_data_ev'].length; ch++) {
			spectrums_data[spe_no][ch] = selected_spectrums[spe_no]['spectrum_data_ev'][ch];
		}
		spectrums_data[spe_no] = spectrum_filter(spectrums_data[spe_no]);
	}
	
	var y_range_max = 0;
	for(var s = 0; s < selected_spectrums.length; s++) {
		for(var i = 0; i < spectrums_data[s].length; i++) {
			if(y_range_max < spectrums_data[s][i][1])
				y_range_max = spectrums_data[s][i][1];
		}
	}
	
	var plot_data = [];
	for(var spe_no = 0; spe_no < selected_spectrums.length; spe_no++) {
		plot_data.push({
			id: 'value' + spe_no,
			label: (spe_no + 1),
			data: spectrums_data[spe_no],
			lines: { show: true, lineWidth: 1 }
		});
	}
	var plot_options = {
		yaxes: [
			{
				min: 0,
				max: y_range_max * parseFloat($("#max_range").val()) / 100,
				tickFormatter: format_cps
			}
		],
		xaxes: [
			{
				show: true
			}
		],
		series: {
			lines: { show: true }
		},
		crosshair: { mode: "x" },
		grid: { hoverable: true, autoHighlight: false },
		selection: {
			mode: "x"
		}
	};
	
	plot = $.plot(placeholder, plot_data, plot_options);
	
	var axes = plot.getAxes();
	var x_range = [axes.xaxis.min, axes.xaxis.max];
	
	var cpsDecimals = 0;
	for(var spe_no = 0; spe_no < selected_spectrums.length; spe_no++) {
		var cpsD = Math.floor(Math.log(selected_spectrums[spe_no]['min_cps']) / Math.log(10));
		if(cpsD < cpsDecimals)
			cpsDecimals = cpsD;
	}
	cpsDecimals = (cpsDecimals < 0) ? -cpsDecimals : 0;
	
	plot_options = $.extend(true, {}, plot_options, {
		yaxes: [
			{
				tickFormatter: format_cps,
				min: 0
			}
		],
		xaxes: [
			{
				show: true,
				tickFormatter: format_ev,
				min: x_range[0],
				max: x_range[1]
			}
		]
	});
	plot = $.plot(placeholder, plot_data, plot_options);
	
	
	// カーソル位置情報
	
	var updateCursorTimeout = null;
	var latestPosition = null;
	
	function updateCursor() {
		updateCursorTimeout = null;
		var pos = latestPosition;
		
		var axes = plot.getAxes();
		if (pos.x < axes.xaxis.min || pos.x > axes.xaxis.max ||
			pos.y < axes.yaxis.min || pos.y > axes.yaxis.max)
			return;
		
		var dataset = plot.getData();
		
		var yvalues = [];
		
		for(var i = 0; i < dataset.length; ++i) {
			if(!dataset[i]['id'].match(/^value/))
				continue;
			
			var y = find_x_cps(dataset[i].data, pos.x);
			yvalues.push(y);
		}
		
		update_curosr_info_multi(pos.x, yvalues, cpsDecimals);
		update_curosr_nuclear(pos.x, cpsDecimals);
	}
	
	// 縦線処理
	
	placeholder.bind("plothover", function(event, pos, item) {
		latestPosition = pos;
		if(!updateCursorTimeout)
			updateCursorTimeout = setTimeout(updateCursor, 50);
	});
	
	// 選択・ズーム処理
	
	$("#zoomout").unbind('click').bind('click', function(){
		var new_options = {
			xaxes: [
				{
					min: x_range[0],
					max: x_range[1]
				}
			]
		};
		draw_graph_common_update(new_options);
	});
	
	placeholder.bind("plotselected", function(event, ranges) {
		
		var selected_x_range = [ranges.xaxis.from, ranges.xaxis.to];
		
		var zoom_fun = function() {
			var new_options = {
				xaxes: [
					{
						min: selected_x_range[0],
						max: selected_x_range[1]
					}
				]
			};
			plot.clearSelection();
			draw_graph_common_update(new_options);
		};
		
		$("#zoom").unbind('click').bind('click', zoom_fun);
		
		
	});
	
	// 範囲プリセット
	var range_preset_html = '範囲設定：';
	for(var i in range_preset) {
		range_preset_html += '<input type="button" id="range_preset_' + i + '" value="' + range_preset[i][0] + '">';
	}
	range_preset_html += '<br><br>';
	$("#range_preset").html(range_preset_html);
	for(var i in range_preset) {
		(function(ii) {
			$("#range_preset_" + i).bind('click', function() {
				var ch_low = range_preset[ii][1] - range_preset[ii][1] * range_preset[ii][2] / 100;
				var ch_high = range_preset[ii][1] + range_preset[ii][1] * range_preset[ii][3] / 100;
				plot.setSelection({
					xaxis: {
						from: ch_low,
						to: ch_high
					}
				});
			});
		})(i)
	}
	
	// 選択範囲情報表示
	
	placeholder.bind("plotselected", function(event, ranges) {
		update_selection_info_multi(selected_spectrums, spectrums_data, ranges, cpsDecimals);
	});
	
	// 縦軸表示範囲
	$("#max_range").unbind('change').bind('change', function() {
		draw_graph_common_multi(spectrums);
	});
	
	// 移動平均方法
	$("#filter_type").unbind('change').bind('change', function() {
		draw_graph_common_multi(spectrums);
	});
	
	// 移動平均ch
	$("#filter").unbind('change').bind('change', function() {
		draw_graph_common_multi(spectrums);
	});
	
	// 対数表示
	
	var min_cps = 1;
	for(var spe_no = 0; spe_no < selected_spectrums.length; spe_no++) {
		if(min_cps > selected_spectrums[spe_no]['min_cps'])
			min_cps = selected_spectrums[spe_no]['min_cps'];
	}
	
	$("#log").unbind('change').bind('change', function() {
		draw_graph_common_update_log(min_cps);
	});
	draw_graph_common_update_log(min_cps);
	
	
}

function find_x_cps(data, x) {
	// find the nearest points, x-wise
	var j;
	for(j = 0; j < data.length; ++j) {
		if (data[j][0] > x)
			break;
	}
	
	// now interpolate
	var y;
	var p1 = data[j - 1];
	var p2 = data[j];
	if(p1 == null)
		y = p2[1];
	else if(p2 == null)
		y = p1[1];
	else
		y = p1[1] + (p2[1] - p1[1]) * (x - p1[0]) / (p2[0] - p1[0]);
	
	return y;
}

function convert_count2cps(time, spectrum) {
	var ret = [];
	$.each(spectrum, function(i, data) {
		ret.push([data[0], data[1] / time]);
	});
	return ret;
}

function draw_graph_common_update(new_options) {
	
	var current_options = plot.getOptions();
	
	var new_options = $.extend(true, {}, current_options, new_options);
	
	plot = $.plot(plot.getPlaceholder(), plot.getData(), new_options);
	
}

function draw_graph_common_update_log(min_cps) {
	
	if($("#log:checked").val()) {
		var min_cps_log = Math.log(min_cps);
		draw_graph_common_update({
			yaxes: [{
				ticks: function(axis) { return draw_graph_common_log_tick_generator(min_cps, axis) },
				min: 0,
				transform: function(val) { return val < min_cps ? min_cps_log - 0.1 : Math.log(val); },
				inverseTransform: function(val) { return val < min_cps_log ? 0 : Math.exp(val); }
			}]
		});
	} else {
		draw_graph_common_update({
			yaxes: [{
				ticks: null,
				transform: function(val) { return val; },
				inverseTransform: function(val) { return val; }
			}]
		});
	}
	
}

function draw_graph_common_log_tick_generator(min_cps, axis) {
	var res = [];
	if(min_cps > 0) {
		var i = Math.floor(Math.log(min_cps) / Math.log(10));
		do {
			var val = i * Math.log(10);
			var num = Math.exp(val);
			res.push([num, num.toExponential(0) + "cps"]);
			++i;
		} while(val <= Math.log(axis.max));
	}
	return res;
}

function update_curosr_info(ch, ev, cps, cpsDecimals, time, find_ch_from_ev) {
	$("#ch").text(ch);
	$("#cps").text(cps.toFixed(cpsDecimals + 1));
	$("#energy").text(ev.toFixed(2));
	$("#count").text((cps * time).toFixed(0));
	
	// Ebs=Eγ-Eceで、Ece=2Eγ^2/(2Eγ+511)
/*	var ece = 2 * Math.pow(ev, 2) / (2 * ev + 511);
	var ebs = ev - ece;
	var ece_ch = find_ch_from_ev(ece);
	var ebs_ch = find_ch_from_ev(ebs);
	var marking_option = {
		grid: {
			markings: [
				{
					color: '#33ff88',
					xaxis: {
						from: ebs_ch,
						to: ebs_ch
					}
				},
				{
					color: '#33ff88',
					xaxis: {
						from: ece_ch,
						to: ece_ch
					}
				}
			]
		}
	};
	draw_graph_common_update(marking_option);
*/
	
}

function update_curosr_info_compare(x, y, cpsDecimals) {
	$("#cmp_energy").text(x.toFixed(2));
	if(y[0] != undefined)
		$("#cmp_cpsA").text(y[0].toFixed(cpsDecimals + 1));
	else
		$("#cmp_cpsA").text('-');
	if(y[1] != undefined)
		$("#cmp_cpsB").text(y[1].toFixed(cpsDecimals + 1));
	else
		$("#cmp_cpsB").text('-');
	if(y[0] != undefined && y[1] != undefined)
		$("#cmp_cps_diff").text((y[1] - y[0]).toFixed(cpsDecimals + 1));
	else
		$("#cmp_cps_diff").text('-');
}

function update_curosr_info_multi(x, y, cpsDecimals) {
	$("#multi_energy").text(x.toFixed(2));
	for(var i = 0; i < y.length; i++) {
		if(y[i] != undefined)
			$("#multi_cps" + (i+1)).text(y[i].toFixed(cpsDecimals + 1));
		else
			$("#multi_cps" + (i+1)).text('-');
	}
}

function update_curosr_nuclear(ev, cpsDecimals) {
	
	var DISP_COUNT = 5;
	
	var sorted_nuclear_data = nuclear_data.sort(function(a, b) {
		return Math.abs(ev - a[0]) - Math.abs(ev - b[0]);
	});
	
	$("#sp_cursor_nuclear").html(sp_cursor_nuclear_html);
	var html = '';
	for(var i = 0; i < DISP_COUNT; ++i) {
		html += '<tr>';
		html += '<td style="text-align: right;">' + sorted_nuclear_data[i][0] + '</td>';
		html += '<td>' + sorted_nuclear_data[i][1] + '</td>';
		html += '<td style="text-align: right;">' + sorted_nuclear_data[i][2] + '</td>';
		html += '<td style="text-align: right;">' + sorted_nuclear_data[i][3] + '</td>';
		html += '</tr>';
	}
	$("#sp_cursor_nuclear_table").after(html);
	
}

function update_selection_info(spectrum, spectrum_data_ch, ranges, find_ev_x, cpsDecimals) {
	
	var from = Math.round(ranges.xaxis.from);
	var to = Math.round(ranges.xaxis.to);
	
	if(from < 0)
		from = 0;
	if(to >= spectrum_data_ch.length)
		to = spectrum_data_ch.length;
	
	$("#sel_s_ch").text(from);
	$("#sel_e_ch").text(to);
	$("#sel_s_ev").text(find_ev_x(from).toFixed(2));
	$("#sel_e_ev").text(find_ev_x(to).toFixed(2));
	
	var gross = 0;
	for(var i = from; i <= to; i++) {
		gross += spectrum_data_ch[i][1];
	}
	
	var gross_error = Math.sqrt(gross * spectrum['time']) / spectrum['time'];
	
	var gross_html = '';
	gross_html += gross.toFixed(cpsDecimals);
	gross_html += '<br>';
	gross_html += '±' + gross_error.toFixed(cpsDecimals);
	gross_html += '<br>';
	gross_html += '±' + (gross_error / gross * 100).toFixed((cpsDecimals >= 2) ? (cpsDecimals - 2) : 2);
	gross_html += '%<br>';
	
	$("#sel_gross").html(gross_html);
	
	var gross_count_html = '';
	gross_count_html += (gross * spectrum['time']).toFixed(0);
	gross_count_html += '<br>';
	gross_count_html += '±' + (gross_error * spectrum['time']).toFixed(1);
	gross_count_html += '<br>';
	gross_count_html += '±' + (gross_error / gross * 100).toFixed((cpsDecimals >= 2) ? (cpsDecimals - 2) : 2);
	gross_count_html += '%<br>';
	$("#sel_gross_count").html(gross_count_html);
	
	
	
	// 左側のBG計算領域を求める
	var left_bg_len = 0;
	var left_bg_ch = 0;
	var left_bg_cps = 0;
	for(var i = range_selectd_left[0]; i <= range_selectd_left[1]; i++) {
		if(i < 0) {
			continue;
		}
		if(i >= from) {
			continue;
		}
		left_bg_ch += i;
		left_bg_len++;
		left_bg_cps += spectrum_data_ch[i][1];
	}
	if(left_bg_len == 0) {
		// 領域が全くない場合は左端の値を使う
		left_bg_ch += from;
		left_bg_len++;
		left_bg_cps += spectrum_data_ch[from][1];
	}
	left_bg_ch /= left_bg_len;
	left_bg_cps /= left_bg_len;
	
	// 右側のBG計算領域を求める
	var right_bg_len = 0;
	var right_bg_ch = 0;
	var right_bg_cps = 0;
	for(var i = range_selectd_right[0]; i <= range_selectd_right[1]; i++) {
		if(i >= spectrum_data_ch.length) {
			break;
		}
		if(i <= to) {
			continue;
		}
		right_bg_ch += i;
		right_bg_len++;
		right_bg_cps += spectrum_data_ch[i][1];
	}
	if(right_bg_len == 0) {
		// 領域が全くない場合は左端の値を使う
		right_bg_ch += to;
		right_bg_len++;
		right_bg_cps += spectrum_data_ch[to][1];
	}
	right_bg_ch /= right_bg_len;
	right_bg_cps /= right_bg_len;
	
	
	// グラフを描画する
	
	var bgline = [];
	var bgline_slope = (right_bg_cps - left_bg_cps) / (right_bg_ch - left_bg_ch);
	for(var ch = left_bg_ch; ch < right_bg_ch; ch += 1) {
		bgline.push([ch, left_bg_cps + (ch - left_bg_ch) * bgline_slope]);
	}
	bgline.push([right_bg_ch, right_bg_cps]);
	
	var plot_data = plot.getData();
	plot_data[1] = {
		data: bgline,
		color: '#ff0000'
	};
	
	plot = $.plot(plot.getPlaceholder(), plot_data, plot.getOptions());
	
	// BG選択エリアをmarkingする
	
	var marking_option = {
		grid: {
			markings: [
				{
					color: '#ffdddd',
					xaxis: {
						from: from,
						to: to
					}
				},
				{
					color: '#f0f0ff',
					xaxis: {
						from: left_bg_ch - (left_bg_len / 2),
						to: left_bg_ch + (left_bg_len / 2)
					}
				},
				{
					color: '#f0f0ff',
					xaxis: {
						from: right_bg_ch - (right_bg_len / 2),
						to: right_bg_ch + (right_bg_len / 2)
					}
				}
			]
		}
	};
	draw_graph_common_update(marking_option);
	
	
	// ネットcpsを計算する
	
	var net = 0;
	var bg = 0;
	for(var i = from; i <= to; i++) {
		var bg_cps = (right_bg_cps - left_bg_cps) / (right_bg_ch - left_bg_ch)
			* (i - left_bg_ch) + left_bg_cps;
		
		bg += bg_cps;
		net += (spectrum_data_ch[i][1] - bg_cps);
	}
	
	// コベル法
	// http://twitter.com/#!/mw_mw_mw/status/138253958669008896
	var np = gross * spectrum['time'];
	var nl = left_bg_cps * left_bg_len * spectrum['time'];
	var nr = right_bg_cps * right_bg_len * spectrum['time'];
	var w = to - from + 1;
	var wl = left_bg_len;
	var wr = right_bg_len;
	var m = (from + to) / 2;
	var ml = left_bg_ch;
	var mr = right_bg_ch;
	var bl = (w / wl) * (mr - m) / (mr - ml);
	var br = (w / wr) * (m - ml) / (mr - ml);
	
	
	var net_error = Math.sqrt(np + Math.pow(bl, 2) * nl + Math.pow(br, 2) * nr) / spectrum['time'];
	
	var net_html = '';
	net_html += net.toFixed(cpsDecimals);
	net_html += '<br>';
	net_html += '±' + net_error.toFixed(cpsDecimals);
	net_html += '<br>';
	net_html += '±' + (net_error / Math.abs(net) * 100).toFixed((cpsDecimals >= 2) ? (cpsDecimals - 2) : 2);
	net_html += '%<br>';
	
	$("#sel_net").html(net_html);
	
	
	var net_count_html = '';
	net_count_html += (net * spectrum['time']).toFixed(0);
	net_count_html += '<br>';
	net_count_html += '±' + (net_error * spectrum['time']).toFixed(1);
	net_count_html += '<br>';
	net_count_html += '±' + (net_error / Math.abs(net) * 100).toFixed((cpsDecimals >= 2) ? (cpsDecimals - 2) : 2);
	net_count_html += '%<br>';
	
	$("#sel_net_count").html(net_count_html);
	
	
}

function update_selection_info_without_bg(spectrum, spectrum_data_ch, ranges, find_ev_x, cpsDecimals) {
	
	var from = Math.round(ranges.xaxis.from);
	var to = Math.round(ranges.xaxis.to);
	
	if(from < 0)
		from = 0;
	if(to >= spectrum_data_ch.length)
		to = spectrum_data_ch.length;
	
	$("#sel_s_ch").text(from);
	$("#sel_e_ch").text(to);
	$("#sel_s_ev").text(find_ev_x(from).toFixed(2));
	$("#sel_e_ev").text(find_ev_x(to).toFixed(2));
	
	var gross = 0;
	for(var i = from; i <= to; i++) {
		gross += spectrum_data_ch[i][1];
	}
	
	var net_html = '';
	net_html += gross.toFixed(cpsDecimals);
	net_html += '<br>';
	
	$("#sel_net").html(net_html);
	
	
	// BG選択エリアをmarkingする
	
	var marking_option = {
		grid: {
			markings: [
				{
					color: '#ffdddd',
					xaxis: {
						from: from,
						to: to
					}
				}
			]
		}
	};
	draw_graph_common_update(marking_option);
	
	
	$("#sel_gross").html('－');
	
	
}

function graph_clear_marking() {
	var plot_data = plot.getData();
	plot_data[1] = {};
	plot = $.plot(plot.getPlaceholder(), plot_data, plot.getOptions());
	
	var marking_option_clear = {
		grid: {
			markings: null
		}
	};
	draw_graph_common_update(marking_option_clear);
}


function update_selection_info_compare(spectrums, spectrums_data, ranges, cpsDecimals) {
	
	var from = Math.round(ranges.xaxis.from);
	var to = Math.round(ranges.xaxis.to);
	
	$("#cmp_sel_s_ev").text(from.toFixed(2));
	$("#cmp_sel_e_ev").text(to.toFixed(2));
	
	var gross = [0, 0];
	for(var d = 0; d < 2; d++) {
		for(var i = 0; i < spectrums_data[d].length; i++) {
			if(from <= spectrums_data[d][i][0] && spectrums_data[d][i][0] <= to)
				gross[d] += spectrums_data[d][i][1];
		}
	}
	
	var gross_error = [];
	for(var d = 0; d < 2; d++) {
		var error = Math.sqrt(gross[d] * spectrums[d]['time']) / spectrums[d]['time'];
		gross_error.push(error);
		
		var gross_html = '';
		gross_html += gross[d].toFixed(cpsDecimals);
		gross_html += '<br>';
		gross_html += '±' + error.toFixed(cpsDecimals);
		gross_html += '<br>';
		gross_html += '±' + (error / gross[d] * 100).toFixed((cpsDecimals >= 2) ? (cpsDecimals - 2) : 2);
		gross_html += '%<br>';
		
		if(d == 0)
			$("#cmp_sel_cpsA").html(gross_html);
		else
			$("#cmp_sel_cpsB").html(gross_html);
	}
	
	var diff_error = Math.sqrt(Math.pow(gross_error[0], 2) + Math.pow(gross_error[1], 2));
	
	var diff_html = '';
	diff_html += (gross[1] - gross[0]).toFixed(cpsDecimals);
	diff_html += '<br>';
	diff_html += '±' + diff_error.toFixed(cpsDecimals);
	diff_html += '<br>';
	diff_html += '±' + (diff_error / (gross[1] - gross[0]) * 100).toFixed((cpsDecimals >= 2) ? (cpsDecimals - 2) : 2);
	diff_html += '%<br>';
	
	$("#cmp_sel_cps_diff").html(diff_html);
}

function update_selection_info_multi(spectrums, spectrums_data, ranges, cpsDecimals) {
	
	var from = Math.round(ranges.xaxis.from);
	var to = Math.round(ranges.xaxis.to);
	
	$("#multi_sel_s_ev").text(from.toFixed(2));
	$("#multi_sel_e_ev").text(to.toFixed(2));
	
	var gross = [];
	for(var d = 0; d < spectrums.length; d++) {
		gross[d] = 0;
		for(var i = 0; i < spectrums_data[d].length; i++) {
			if(from <= spectrums_data[d][i][0] && spectrums_data[d][i][0] <= to)
				gross[d] += spectrums_data[d][i][1];
		}
	}
	
	for(var d = 0; d < spectrums.length; d++) {
		var error = Math.sqrt(gross[d] * spectrums[d]['time']) / spectrums[d]['time'];
		
		var gross_html = '';
		gross_html += gross[d].toFixed(cpsDecimals);
		gross_html += '<br>';
		gross_html += '±' + error.toFixed(cpsDecimals);
		gross_html += '<br>';
		gross_html += '±' + (error / gross[d] * 100).toFixed((cpsDecimals >= 2) ? (cpsDecimals - 2) : 2);
		gross_html += '%<br>';
		
		$("#multi_sel_cps" + (d+1)).html(gross_html);
	}
	
}

function print_sp_info(spectrum) {
	var sp_info = spectrum['sp_info'];
	
	var html = '';
	
	// URL情報
	document.location.hash = "#__" + encodeURIComponent(spectrum['file']) + "//" + spectrum['no'];
	var url = document.location.protocol + "//" + document.location.host + document.location.pathname + document.location.hash;
	html += '<p>URL: ';
	html += '<a href="' + url + '" target="_blank">' + url + '</a></p>';
	
	html += '<table class="csv">';
	for(var i in sp_info) {
		html += '<tr>';
		html += '<th nowrap>' + sp_info[i][0] + '</th>';
		html += '<td style="text-align: right">' + sp_info[i][1] + '</td>';
		html += '</tr>';
	}
	html += '</table>';
	
	if(spectrum['additional_sp_info_html']) {
		html += '<br>' + spectrum['additional_sp_info_html'];
	}
	
	$("#sp_info").html(html);
	
	if(spectrum['additional_html_callback']) {
		spectrum['additional_html_callback']();
	}
}

function print_sp_info_compare(spectrums) {
	
	var html = '';
	
	// URL情報
	document.location.hash = "#2__"
		+ encodeURIComponent(spectrums[0]['file']) + '/'
		+ encodeURIComponent(spectrums[1]['file']) + '//'
		+ spectrums[0]['no'] + '/'
		+ spectrums[1]['no'];
	var url = document.location.protocol + "//" + document.location.host + document.location.pathname + document.location.hash;
	html += '<p>URL: ';
	html += '<a href="' + url + '" target="_blank">' + url + '</a></p>';
	
	if(spectrums[1]['additional_sp_info_html']) {
		html += '<br>' + spectrums[1]['additional_sp_info_html'];
	}
	html += '※スペクトルファイルの詳細情報は試料本体（BGではない方）のみ表示されます．<br>';
	
	if(spectrums[0]['without_bg'] && spectrums[1]['without_bg']) {
		html += '※スペクトルＢのデータはスペクトルＡを減算済みとして，スペクトルＢのグラフはＡの結果を加算して表示しています．<br>';
	}
	
	$("#sp_info").html(html);
	
	
}

function print_sp_info_multi(spectrums) {
	
	var html = '';
	
	// スペクトル一覧
	var colors = ["#edc240", "#afd8f8", "#cb4b4b", "#4da74d", "#9440ed"];
	html += '<table class="csv">';
	for(var i = 0; i < spectrums.length; i++) {
		var name = '';
		if(spectrums[i]['name'] != undefined) {
			name = '【' + spectrums[i]['name'] + '】 ';
		}
		html += '<tr><th>' + (i+1) + '</th><td><font color="' + colors[i] + '">■</font>' + name + spectrums[i]['file_comment'] + '</td></tr>';
	}
	html += '</table>';
	
	
	// URL情報
	var hash = "#3__";
	var file_sel_no = {};
	for(var i = 0; i < spectrums.length; i++) {
		if(!file_sel_no[spectrums[i]['file']])
			file_sel_no[spectrums[i]['file']] = [];
		file_sel_no[spectrums[i]['file']].push(spectrums[i]['no']);
	}
	var file_dup_check = {};
	for(var i = 0; i < spectrums.length; i++) {
		if(!file_dup_check[spectrums[i]['file']]) {
			hash += encodeURIComponent(spectrums[i]['file']) + '/';
			file_dup_check[spectrums[i]['file']] = 1;
		}
	}
	hash = hash.replace(/\/$/, "");
	hash += '//';
	file_dup_check = {};
	for(var i = 0; i < spectrums.length; i++) {
		if(!file_dup_check[spectrums[i]['file']]) {
			hash += file_sel_no[spectrums[i]['file']].join(".") + '/';
			file_dup_check[spectrums[i]['file']] = 1;
		}
	}
	hash = hash.replace(/\/$/, "");
	
	document.location.hash = hash;
	var url = document.location.protocol + "//" + document.location.host + document.location.pathname + document.location.hash;
	html += '<p>URL: ';
	html += '<a href="' + url + '" target="_blank">' + url + '</a></p>';
	
	html += '※スペクトルファイルの詳細情報は[スペクトル表示]で１ファイルのみ選んだときのみ表示されます．<br>';
	
	$("#sp_info").html(html);
}

function format_cps(val, axis) {
	return val.toFixed(axis.tickDecimals) + "cps";
}

function format_ch(val, axis) {
	return val.toFixed(axis.tickDecimals) + "ch";
}

function format_ev(val, axis) {
	return val.toFixed(axis.tickDecimals) + "keV";
}

function format_time(second) {
	var sec = second % 60;
	var min = Math.floor(second / 60) % 60;
	var hour = Math.floor(second / 60 / 60);
	
	return hour.toString() + ":" + format_int(min, 2) + ":" + format_int(sec, 2);
}

function format_int(num, len) {
	var ret = num.toFixed(0);
	while(ret.length < len) {
		ret = "0" + ret;
	}
	return ret;
}

function split_line(data) {
	var lines = data.replace(/\r?\n|\r/g, "\n").split("\n");
	if(lines[lines.length - 1] == "") {
		lines.pop();
	}
	return lines;
}

function round_to_fixed(n, val) {
	return (Math.round(val * Math.pow(10, n)) / Math.pow(10, n)).toFixed(n);
}


})();

