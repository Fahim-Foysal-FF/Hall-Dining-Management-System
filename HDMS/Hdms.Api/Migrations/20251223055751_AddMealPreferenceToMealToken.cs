using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hdms.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMealPreferenceToMealToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "TokenUid",
                table: "MealTokens",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<string>(
                name: "MealPreference",
                table: "MealTokens",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MealPreference",
                table: "MealTokens");

            migrationBuilder.AlterColumn<string>(
                name: "TokenUid",
                table: "MealTokens",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");
        }
    }
}
