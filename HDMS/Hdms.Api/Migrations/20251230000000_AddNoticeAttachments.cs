using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hdms.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNoticeAttachments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FileName",
                table: "DiningNotices",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FileUrl",
                table: "DiningNotices",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FileName",
                table: "DiningNotices");

            migrationBuilder.DropColumn(
                name: "FileUrl",
                table: "DiningNotices");
        }
    }
}