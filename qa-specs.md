Basically there should be a link between revenue and variable expenses. When revenue rises, the variable expenses should rise linearly, but the portion that should be adjustable are fixed expenses

So the green line would be a linear formula plotted
1*(1+monthly growth rate)
the variable expenses would be the green line * (1 - gross margin)
and then the fixed expenses would be a horizontal line that would be constant
and set by the user
so inputs would be starting monthly revenue, gross margin, fixed expenses, monthly growth rate


Question: will we have a period variable?
Answer:
no, I don't think. the idea is that you're trying to find when they cross
they being the line representing variable expenses + fixed expenses
crossing with the revenue line


Question: so we’ll have these lines:
Line 1 — Green
Revenue
Goes up over time

Line 2 — Red
Variable expenses
Goes up over time, always below revenue

Line 3 — Gray (horizontal)
Fixed expenses
Flat line
Line 4 — Black
Total expenses = variable + fixed
Goes up over time

Answer:
yes
the line 2 and line 3 should be light shades
the black line should be bolded
and what we care about is when the black and green line cross over
which functionally should be when the equations = each other

Question:
and now the inputs:
Green line start point: drag up/down => changes starting revenue
Green line slope handle: drag steeper/flatter => changes growth rate
Gray horizontal line: drag up/down => changes fixed expenses
Distance between green and red lines: drag => changes gross margin

Answer:
if you do it this way ^ the distance between green and red line should be called Variable %
because gross margin is what's left over after you've paid your variable expenses

Question:
i see. so should the numbers be regular text inputs?
Answer:
Either way
You can do it in the way you described, labels just have to change
or you can add input boxes
and then adjust the formulas so that they render the chart
only upside of the adjustable handles
is that it's continuous, so the user can play around easier
