// Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)
//
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0

// Tables have several exclusie modes, which generate separate constraint sets.
// We generate constraints for each cell based on the policy we observe by
// inspecting the column and the outer table.
//
// CSS tables are described (somewhat) here:
//
//      http://www.w3.org/TR/CSS2/tables.html
//
// In general, we attempt to:
//
//  * Minimize the overall width and height of tables (tight fitting)
//  * Distribute the width of columns evenly
//  * Minimize column widths, subject to:
//      - Maximum natural width of the columns cells
//      - Percentage or unit specified width (if larger than max natural width)
//
// TODO(slightlyoff):
//  * Use Mutation Observers to trigger re-analysis of the table DOM and
//    mode-switching (constraint addition/removal)
//  * Colspan
