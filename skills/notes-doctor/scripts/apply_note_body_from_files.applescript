on run argv
	if (count of argv) is less than 1 then error "usage: osascript apply_note_body_from_files.applescript <id_file_tsv>"
	set mapping_path to item 1 of argv
	set txt to do shell script "cat " & quoted form of mapping_path
	set rows to paragraphs of txt

	set updated_count to 0
	set fail_count to 0

	tell application "Notes"
		repeat with row_text in rows
			if row_text is "" then
				-- skip
			else
				set AppleScript's text item delimiters to tab
				set parts to text items of row_text
				if (count of parts) < 2 then
					set fail_count to fail_count + 1
				else
					set note_id to item 1 of parts
					set html_path to item 2 of parts
					try
						set note_ref to first note whose id is note_id
						set html_body to do shell script "cat " & quoted form of html_path
						set body of note_ref to html_body
						set updated_count to updated_count + 1
					on error
						set fail_count to fail_count + 1
					end try
				end if
			end if
		end repeat
	end tell

	return "updated=" & updated_count & ",failed=" & fail_count
end run
